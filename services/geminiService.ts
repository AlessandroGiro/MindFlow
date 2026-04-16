
import { GoogleGenAI, Type } from "@google/genai";
// FIX: The import path for types was incorrect. It should point to 'types/index'.
import { Project, Task, TeamMember, ProjectComment, TaskStatus, AISummarySettings, MindMapNode, MindMapEdge } from "../types/index";

const TASK_GENERATION_PROMPT = `
You are a project management assistant. Based on the project name, description, and the list of available team members, generate a list of relevant tasks to get the project started.

**Project Name:** {projectName}
**Project Description:** {projectDescription}
**Team Members:** {teamMembers}

Analyze the project and provide a list of tasks. For each task, provide a concise task name, a brief description, a suggested assignee from the provided team list, and a priority level ('Low', 'Medium', 'High', 'Urgent'). Ensure the assignee is one of the names from the team members list.
`;

const responseSchema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        taskName: {
          type: Type.STRING,
          description: 'The concise name of the task.',
        },
        description: {
          type: Type.STRING,
          description: 'A brief, one-sentence description of what the task involves.',
        },
        assignee: {
            type: Type.STRING,
            description: 'The name of the team member who should be assigned this task. Must be a name from the provided team list.'
        },
        priority: {
            type: Type.STRING,
            description: "The priority of the task, which can be 'Low', 'Medium', 'High', or 'Urgent'."
        }
      },
      required: ["taskName", "description", "assignee", "priority"],
    },
};

type GeneratedTask = Pick<Task, 'taskName' | 'description' | 'assignee' | 'priority'>;

/**
 * Generates a list of initial tasks for a new project using the Gemini API.
 * @param projectName The name of the project.
 * @param projectDescription A description of the project goals.
 * @param team A list of available team members.
 * @returns A promise that resolves to an array of generated tasks.
 */
export const generateTasks = async (
    projectName: string,
    projectDescription: string,
    team: TeamMember[]
): Promise<GeneratedTask[]> => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        const teamMemberNames = team.map(member => member.name).join(', ');
        const prompt = TASK_GENERATION_PROMPT
            .replace('{projectName}', projectName)
            .replace('{projectDescription}', projectDescription)
            .replace('{teamMembers}', teamMemberNames);

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
              responseMimeType: "application/json",
              responseSchema: responseSchema,
            },
        });
        
        let jsonStr = response.text.trim();
        const tasks: GeneratedTask[] = JSON.parse(jsonStr);
        
        // Basic validation
        if (!Array.isArray(tasks)) {
             throw new Error("AI response is not a valid array.");
        }

        return tasks;

    } catch (error) {
        console.error("Error generating tasks with Gemini:", error);
        // Return an empty array or re-throw the error, depending on desired error handling
        throw new Error("Failed to generate tasks. Please try again.");
    }
};


/**
 * Generates an executive summary for a project using the Gemini API.
 * @param project The project object.
 * @param tasks A list of tasks for the project.
 * @param publicComments A list of public comments for the project.
 * @param settings User-defined settings for summary generation.
 * @returns A promise that resolves to the generated summary string.
 */
export const generateExecutiveSummary = async (
    project: Project,
    tasks: Task[],
    publicComments: ProjectComment[],
    settings: AISummarySettings
): Promise<string> => {
     try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

        const taskCounts = tasks.reduce((acc, task) => {
            acc[task.status] = (acc[task.status] || 0) + 1;
            return acc;
        }, {} as Record<TaskStatus, number>);
        
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        const overdueTasks = tasks
            .filter(task => task.status !== 'Done' && task.dueDate && new Date(task.dueDate) < today)
            .map(task => `- ${task.taskName} (Overdue)`);

        const upcomingTasks = tasks
            .filter(task => task.status !== 'Done' && task.dueDate)
            .filter(task => {
                const dueDate = new Date(task.dueDate);
                const diffTime = dueDate.getTime() - today.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                return diffDays >= 0 && diffDays <= 7;
            })
            .sort((a,b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
            .map(task => {
                const dueDate = new Date(task.dueDate!);
                const diffTime = dueDate.getTime() - today.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                if (diffDays === 0) return `- ${task.taskName} (Due today)`;
                return `- ${task.taskName} (Due in ${diffDays} day${diffDays !== 1 ? 's' : ''})`;
            });

        let deadlinesInfo = 'No pressing deadlines.';
        if (overdueTasks.length > 0 || upcomingTasks.length > 0) {
            deadlinesInfo = [
                ...overdueTasks,
                ...upcomingTasks,
            ].join('\n');
        }


        // Build a more structured comment/reply history, providing deeper context.
        // We take the 30 most recent comments and process them chronologically.
        const commentEntries = publicComments
            .slice(0, 30) // Get the 30 most recent public comments and replies
            .reverse() // Process them chronologically (oldest to newest)
            .map(comment => {
                let entry = '';
                const task = tasks.find(t => t.taskId === comment.taskId);
                const cleanContent = comment.content
                    .replace(/^\[REPLY_TO:(?:COMMENT|TEMP)-[\w.-]+\]\s*/, '') // Remove reply markers which are redundant now
                    .replace(/\n/g, ' '); // Flatten newlines for the prompt

                // Check if the parent comment is also within our context slice to determine if it's a reply
                const isReply = comment.parentId && publicComments.some(p => p.commentId === comment.parentId);

                if (isReply) {
                    entry += '  '; // Indent replies to show conversation threads
                }

                entry += `- (${new Date(comment.createdAt).toLocaleDateString()}) `;

                if (task) {
                    // Clarify that this is a comment on a specific task
                    entry += `[On Task: "${task.taskName}"] `;
                }
                
                entry += `${comment.author}: ${cleanContent}`;
                return entry;
            })
            .join('\n');
        
        // Build the prompt dynamically based on settings
        let promptInstructions = `
You are a senior project manager. Your task is to craft an executive summary of a project's recent progress by analyzing all the provided context.

**Instructions:**
1. Weave the project's goals, task progress, team discussions (from the comments and replies), and deadlines into a clear summary.
2. If a previous AI summary exists (comments from "AI Assistant"), focus on updates since then.
3. The tone must be: **${settings.tone}**.
4. The format must be a **${settings.format}**.
5. Use markdown for structure. Always start with a bolded "**Executive Summary**" title followed by a summary paragraph.
`;

        const sections = [];
        if (settings.includeKeyDevelopments) {
            sections.push('a "**Key Developments**" section using a bulleted list for major accomplishments or blockers identified in discussions.');
        }
        if (settings.includeNextSteps) {
            sections.push('a "**Current Focus & Next Steps**" section using a numbered list for priorities, informed by recent activity.');
        }

        if (sections.length > 0) {
            promptInstructions += `6. After the summary paragraph, include ${sections.join(' and ')}\n`;
        }

        promptInstructions += `7. Keep the entire summary concise and impactful.`;

        const promptData = `
**Project Data:**

**Project Name:** {projectName}
**Project Description:** {projectDescription}
**Project Lead:** {projectLead}

**Task Breakdown:**
- To Do: {toDoCount}
- In Progress: {inProgressCount}
- In Review: {inReviewCount}
- Done: {doneCount}

**Deadlines Overview:**
{deadlinesInfo}

**Recent Public Discussions (Comments & Replies, oldest first):**
{commentEntries}

---
Craft the summary now.
`;
        
        const fullPrompt = (promptInstructions + promptData)
            .replace('{projectName}', project.projectName)
            .replace('{projectDescription}', project.description)
            .replace('{projectLead}', project.projectLead)
            .replace('{toDoCount}', ((taskCounts['To Do'] || 0) + (taskCounts['Backlog'] || 0)).toString())
            .replace('{inProgressCount}', (taskCounts['In Progress'] || 0).toString())
            .replace('{inReviewCount}', (taskCounts['In Review'] || 0).toString())
            .replace('{doneCount}', (taskCounts['Done'] || 0).toString())
            .replace('{deadlinesInfo}', deadlinesInfo)
            .replace('{commentEntries}', commentEntries || 'No recent comments or replies.');
        
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: fullPrompt,
        });

        return response.text.trim();

     } catch (error) {
        console.error("Error generating summary with Gemini:", error);
        throw new Error("Failed to generate AI summary. Please try again.");
     }
};

/**
 * Generates a Mind Map structure from a text description.
 * @param description The user's prompt describing the process.
 * @returns A promise resolving to nodes and edges.
 */
export const generateMindMap = async (
    description: string
): Promise<{ nodes: MindMapNode[], edges: MindMapEdge[] }> => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        const prompt = `
        You are an expert process engineer and flowchart designer.
        Create a complex and logical flowchart/mindmap based on this description: "${description}".
        
        **Constraints & Layout:**
        1.  Layout the nodes in a logical hierarchical flow (Top-to-Bottom or Left-to-Right as appropriate).
        2.  Node Types must be: 'START', 'PROCESS', 'DECISION', 'END', 'GROUP', 'COMMENT'.
        3.  **Coordinates are critical**: 
            - Start the root/start node at roughly x=400, y=100.
            - Spacing: Minimum 300px horizontal space between parallel branches. Minimum 200px vertical space between hierarchical levels.
            - Ensure no nodes overlap.
        4.  **Node Sizes**:
            - START/END: width 120, height 50
            - PROCESS: width 160, height 80
            - DECISION: width 140, height 140
            - COMMENT: width 180, height 100
        5.  For 'GROUP' nodes, define them as a bounding box around their children (width/height should encapsulate them).
        6.  Return raw JSON only. No code blocks.
        
        **Output Schema:**
        {
            "nodes": [
                { "id": "string", "type": "START|PROCESS|DECISION|END|GROUP|COMMENT", "label": "string", "x": number, "y": number, "width": number, "height": number, "parentId": "optional_string_id" }
            ],
            "edges": [
                { "id": "string", "source": "node_id", "target": "node_id", "label": "optional_string" }
            ]
        }
        `;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json"
            }
        });

        const result = JSON.parse(response.text.trim());
        return result;

    } catch (error) {
        console.error("Error generating mind map:", error);
        throw new Error("Failed to generate mind map.");
    }
};