// FIX: The import path for types was incorrect. It should point to 'types/index'.
import { Project, Task, TeamMember, TaskStatus, Priority, ProjectComment } from '../types/index';

// This is a bridge to the google.script.run functions in the backend (code.gs)
// The 'google' object is globally available in the Apps Script HTML service environment.
let server: any;

// A simple in-memory cache for local dev to prevent re-fetching on every hot reload
let devCache: any = null;

// Check if running inside Google Apps Script, if not, create a mock for local development.
try {
  // @ts-ignore
  if (typeof google !== 'undefined' && google.script && google.script.run) {
    // Production environment (running in Apps Script)
    // @ts-ignore
    server = google.script.run;
  } else {
    throw new Error("Not in Apps Script environment");
  }
} catch (e) {
  // Local development environment
  console.warn("Running in local development mode. Using mock server data. API calls will be simulated.");

  const MOCK_PROJECTS: Project[] = [
    { projectId: 'PROJ-1', projectName: 'Phoenix UI Library', projectLead: 'Olivia Chen', status: 'Active', description: 'Developing a comprehensive, reusable component library to standardize the user interface across all new web applications. The key goals are to improve developer efficiency, ensure design consistency, and enforce accessibility standards (WCAG 2.1 AA).', members: ['Olivia Chen', 'Mason Williams', 'Ava Nguyen', 'Ethan James'] },
    { projectId: 'PROJ-2', projectName: 'Q4 \'Odyssey\' Product Launch', projectLead: 'Ben Carter', status: 'Active', description: 'A coordinated marketing and PR campaign for the flagship \'Odyssey\' software suite. This launch aims to capture a 15% market share within the first six months by targeting enterprise clients with a mix of digital advertising, influencer outreach, and a high-profile launch event.', members: ['Ben Carter', 'Sophia Rodriguez', 'Liam Goldberg', 'Olivia Chen'] },
    { projectId: 'PROJ-3', projectName: 'AI Customer Support Bot', projectLead: 'Ava Nguyen', status: 'Active', description: 'Building an intelligent, AI-powered chatbot to handle Tier 1 customer support inquiries. The bot will integrate with our existing CRM to provide instant, 24/7 support, aiming to reduce average customer response times by 70% and free up human agents for more complex issues.', members: ['Ava Nguyen', 'Mason Williams', 'Olivia Chen', 'Ethan James'] },
    { projectId: 'PROJ-4', projectName: 'Internal HR Portal', projectLead: 'Sophia Rodriguez', status: 'Planning', description: 'A new self-service portal for employees to manage PTO, benefits, and payroll information. This initiative will centralize HR resources, streamline common administrative tasks, and improve the overall employee experience by providing easy access to personal information.', members: ['Sophia Rodriguez', 'Liam Goldberg', 'Olivia Chen', 'Mason Williams', 'Ava Nguyen', 'Ethan James'] },
    { projectId: 'PROJ-5', projectName: '2025 Annual Company Retreat', projectLead: 'Liam Goldberg', status: 'Backlog', description: 'Planning and organizing the annual off-site retreat for all company employees. As the first retreat since 2019, the focus is on reconnecting teams, fostering collaboration, and celebrating company-wide achievements in a relaxed, engaging environment.', members: ['Liam Goldberg', 'Sophia Rodriguez', 'Ben Carter'] },
  ];

  let MOCK_TASKS: Task[] = [
    // --- Project: Phoenix UI Library ---
    { taskId: 'TASK-101', taskName: 'Design System Foundation', project: 'Phoenix UI Library', assignee: 'Olivia Chen', status: 'Done', subStatus: 'Completed', priority: 'High', startDate: '2024-07-01', dueDate: '2024-07-10', completionDate: '2024-07-09T10:00:00Z', description: 'Establish color palette, typography, spacing, and grid system for the library.', parentId: null, createdAt: '2024-07-01T09:00:00Z' },
    { taskId: 'TASK-102', taskName: 'Build Button Component', project: 'Phoenix UI Library', assignee: 'Mason Williams', status: 'Done', subStatus: 'Completed', priority: 'High', startDate: '2024-07-11', dueDate: '2024-07-15', completionDate: '2024-07-14T15:30:00Z', description: 'Create a versatile button component with variants for primary, secondary, and tertiary actions.', parentId: 'TASK-101', createdAt: '2024-07-10T11:00:00Z' },
    { taskId: 'TASK-103', taskName: 'Build Input Component', project: 'Phoenix UI Library', assignee: 'Mason Williams', status: 'Done', subStatus: 'Completed', priority: 'High', startDate: '2024-07-16', dueDate: '2024-07-20', completionDate: '2024-07-20T18:00:00Z', description: 'Develop text input, textarea, and select components with validation states.', parentId: 'TASK-101', createdAt: '2024-07-15T10:00:00Z' },
    { taskId: 'TASK-104', taskName: 'Build Modal Component', project: 'Phoenix UI Library', assignee: 'Ava Nguyen', status: 'In Review', subStatus: 'Completed', priority: 'Medium', startDate: '2024-07-21', dueDate: '2024-07-28', completionDate: null, description: 'Construct an accessible modal/dialog component for pop-up information and forms.', parentId: null, createdAt: '2024-07-20T13:00:00Z' },
    { taskId: 'TASK-105', taskName: 'Write Documentation for All Components', project: 'Phoenix UI Library', assignee: 'Olivia Chen', status: 'In Progress', subStatus: 'In Progress', priority: 'Medium', startDate: '2024-07-22', dueDate: '2024-08-05', completionDate: null, description: 'Use Storybook to create comprehensive documentation with examples for each component.', parentId: null, createdAt: '2024-07-21T16:00:00Z' },
    { taskId: 'TASK-106', taskName: 'Fix button accessibility issue on Safari', project: 'Phoenix UI Library', assignee: 'Mason Williams', status: 'To Do', subStatus: 'Pending', priority: 'Urgent', startDate: '2024-07-29', dueDate: '2024-07-31', completionDate: null, description: 'The focus ring on the button component is not rendering correctly in recent versions of Safari.', parentId: 'TASK-102', createdAt: '2024-07-28T10:00:00Z' },
    { taskId: 'TASK-107', taskName: 'Explore adding dark mode theme', project: 'Phoenix UI Library', assignee: 'Olivia Chen', status: 'Backlog', subStatus: 'Pending', priority: 'Low', startDate: null, dueDate: null, completionDate: null, description: 'Research best practices for theming and implement a proof-of-concept for dark mode.', parentId: null, createdAt: '2024-07-25T14:00:00Z' },
    { taskId: 'TASK-108', taskName: 'Setup Automated Visual Regression Testing', project: 'Phoenix UI Library', assignee: 'Ava Nguyen', status: 'To Do', subStatus: 'Pending', priority: 'High', startDate: '2024-08-01', dueDate: '2024-08-10', completionDate: null, description: 'Integrate a tool like Chromatic or Percy into the CI/CD pipeline to catch unintended visual changes in components.', parentId: null, createdAt: '2024-07-30T10:00:00Z' },
    { taskId: 'TASK-109', taskName: 'Peer review Ava\'s Modal component', project: 'Phoenix UI Library', assignee: 'Mason Williams', status: 'To Do', subStatus: 'Pending', priority: 'Medium', startDate: '2024-08-02', dueDate: '2024-08-03', completionDate: null, description: 'Provide feedback on the accessibility and implementation of the new Modal component.', parentId: 'TASK-104', createdAt: '2024-08-01T11:00:00Z' },
    { taskId: 'TASK-110', taskName: 'Performance audit of existing components', project: 'Phoenix UI Library', assignee: 'Ethan James', status: 'To Do', subStatus: 'Pending', priority: 'Medium', startDate: '2024-08-05', dueDate: '2024-08-12', completionDate: null, description: 'Analyze the render performance of the Button, Input, and Modal components, and identify optimization opportunities.', parentId: null, createdAt: '2024-08-02T09:00:00Z' },
    { taskId: 'TASK-111', taskName: 'Implement Tree View Component', project: 'Phoenix UI Library', assignee: 'Olivia Chen', status: 'Backlog', subStatus: 'Pending', priority: 'Low', startDate: null, dueDate: null, completionDate: null, description: 'Design and build a new component for displaying hierarchical data.', parentId: null, createdAt: '2024-08-03T14:00:00Z' },
    { taskId: 'TASK-112', taskName: 'Publish v1.0.0 to npm', project: 'Phoenix UI Library', assignee: 'Olivia Chen', status: 'Backlog', subStatus: 'Pending', priority: 'High', startDate: null, dueDate: null, completionDate: null, description: 'Finalize versioning, changelog, and publish the first major version of the component library to the internal npm registry.', parentId: null, createdAt: '2024-08-04T10:00:00Z' },

    // --- Project: Q4 'Odyssey' Product Launch ---
    { taskId: 'TASK-201', taskName: 'Finalize Launch Strategy & KPIs', project: 'Q4 \'Odyssey\' Product Launch', assignee: 'Ben Carter', status: 'Done', subStatus: 'Completed', priority: 'Urgent', startDate: '2024-07-15', dueDate: '2024-07-20', completionDate: '2024-07-19T12:00:00Z', description: 'Finalize the go-to-market strategy and define key performance indicators for success.', parentId: null, createdAt: '2024-07-15T09:00:00Z' },
    { taskId: 'TASK-202', taskName: 'Draft Press Release', project: 'Q4 \'Odyssey\' Product Launch', assignee: 'Sophia Rodriguez', status: 'In Review', subStatus: 'Completed', priority: 'High', startDate: '2024-07-22', dueDate: '2024-07-26', completionDate: null, description: 'Write the official press release for the product launch, to be distributed to media outlets.', parentId: null, createdAt: '2024-07-21T10:00:00Z' },
    { taskId: 'TASK-203', taskName: 'Create Social Media Ad Creatives', project: 'Q4 \'Odyssey\' Product Launch', assignee: 'Liam Goldberg', status: 'In Progress', subStatus: 'In Progress', priority: 'High', startDate: '2024-07-25', dueDate: '2024-08-05', completionDate: null, description: 'Design visuals and write copy for ad campaigns on Instagram, LinkedIn, and Twitter.', parentId: null, createdAt: '2024-07-24T11:00:00Z' },
    { taskId: 'TASK-204', taskName: 'Develop Email Campaign Sequence', project: 'Q4 \'Odyssey\' Product Launch', assignee: 'Sophia Rodriguez', status: 'In Progress', subStatus: 'In Progress', priority: 'Medium', startDate: '2024-07-29', dueDate: '2024-08-10', completionDate: null, description: 'Create a 5-part email drip campaign for the waitlist, leading up to launch day.', parentId: null, createdAt: '2024-07-28T14:00:00Z' },
    { taskId: 'TASK-205', taskName: 'Develop Launch Landing Page', project: 'Q4 \'Odyssey\' Product Launch', assignee: 'Olivia Chen', status: 'To Do', subStatus: 'Pending', priority: 'High', startDate: '2024-08-01', dueDate: '2024-08-08', completionDate: null, description: 'Build a high-impact landing page for the launch, including a signup form and feature overview.', parentId: null, createdAt: '2024-07-31T16:00:00Z' },
    { taskId: 'TASK-206', taskName: 'Coordinate with Tech Influencers', project: 'Q4 \'Odyssey\' Product Launch', assignee: 'Liam Goldberg', status: 'To Do', subStatus: 'Pending', priority: 'Medium', startDate: '2024-08-05', dueDate: '2024-08-15', completionDate: null, description: 'Reach out and send demo units to key tech influencers for early reviews.', parentId: null, createdAt: '2024-08-02T13:00:00Z' },
    { taskId: 'TASK-207', taskName: 'Analyze Post-Launch Metrics', project: 'Q4 \'Odyssey\' Product Launch', assignee: 'Ben Carter', status: 'Backlog', subStatus: 'Pending', priority: 'High', startDate: null, dueDate: null, completionDate: null, description: 'Compile and analyze all launch KPIs one week after launch day.', parentId: null, createdAt: '2024-08-01T10:00:00Z' },
    { taskId: 'TASK-208', taskName: 'Book venue for launch event', project: 'Q4 \'Odyssey\' Product Launch', assignee: 'Liam Goldberg', status: 'Done', subStatus: 'Completed', priority: 'Urgent', startDate: '2024-07-20', dueDate: '2024-07-25', completionDate: '2024-07-24T17:00:00Z', description: 'Finalize and book the venue for the main product launch event in San Francisco.', parentId: null, createdAt: '2024-07-20T09:00:00Z' },
    { taskId: 'TASK-209', taskName: 'Finalize guest list for launch event', project: 'Q4 \'Odyssey\' Product Launch', assignee: 'Liam Goldberg', status: 'In Progress', subStatus: 'In Progress', priority: 'High', startDate: '2024-07-26', dueDate: '2024-08-02', completionDate: null, description: 'Compile the final list of attendees, including media, partners, and key customers.', parentId: 'TASK-208', createdAt: '2024-07-25T13:00:00Z' },
    { taskId: 'TASK-210', taskName: 'A/B test landing page copy', project: 'Q4 \'Odyssey\' Product Launch', assignee: 'Sophia Rodriguez', status: 'To Do', subStatus: 'Pending', priority: 'Medium', startDate: '2024-08-09', dueDate: '2024-08-14', completionDate: null, description: 'Test two versions of the landing page headline to see which one has a better conversion rate for signups.', parentId: 'TASK-205', createdAt: '2024-08-08T11:00:00Z' },
    { taskId: 'TASK-211', taskName: 'Prepare presentation deck for launch event', project: 'Q4 \'Odyssey\' Product Launch', assignee: 'Ben Carter', status: 'To Do', subStatus: 'Pending', priority: 'High', startDate: '2024-08-10', dueDate: '2024-08-20', completionDate: null, description: 'Create the keynote presentation slides for the launch event, covering key features and market strategy.', parentId: null, createdAt: '2024-08-09T15:00:00Z' },

    // --- Project: AI Customer Support Bot ---
    { taskId: 'TASK-301', taskName: 'Define Bot Persona & Scope', project: 'AI Customer Support Bot', assignee: 'Ava Nguyen', status: 'Done', subStatus: 'Completed', priority: 'High', startDate: '2024-07-10', dueDate: '2024-07-15', completionDate: '2024-07-14T11:00:00Z', description: 'Define the personality, tone of voice, and exact scope of issues the bot will handle.', parentId: null, createdAt: '2024-07-10T09:00:00Z' },
    { taskId: 'TASK-302', taskName: 'Set up Google Cloud AI Environment', project: 'AI Customer Support Bot', assignee: 'Mason Williams', status: 'Done', subStatus: 'Completed', priority: 'Urgent', startDate: '2024-07-16', dueDate: '2024-07-18', completionDate: '2024-07-17T17:00:00Z', description: 'Configure the necessary cloud projects, APIs, and permissions for the AI model.', parentId: null, createdAt: '2024-07-15T14:00:00Z' },
    { taskId: 'TASK-303', taskName: 'Ingest Knowledge Base Articles', project: 'AI Customer Support Bot', assignee: 'Mason Williams', status: 'In Review', subStatus: 'Completed', priority: 'High', startDate: '2024-07-19', dueDate: '2024-07-25', completionDate: null, description: 'Write scripts to parse and ingest the existing Zendesk knowledge base into the model.', parentId: null, createdAt: '2024-07-18T10:00:00Z' },
    { taskId: 'TASK-304', taskName: 'Train Intent Recognition Model', project: 'AI Customer Support Bot', assignee: 'Ava Nguyen', status: 'In Progress', subStatus: 'In Progress', priority: 'High', startDate: '2024-07-26', dueDate: '2024-08-10', completionDate: null, description: 'Train and fine-tune the AI model to accurately recognize user intents from their questions.', parentId: null, createdAt: '2024-07-25T11:00:00Z' },
    { taskId: 'TASK-305', taskName: 'Develop API for CRM Integration', project: 'AI Customer Support Bot', assignee: 'Mason Williams', status: 'To Do', subStatus: 'Pending', priority: 'Medium', startDate: '2024-08-01', dueDate: '2024-08-15', completionDate: null, description: 'Build an API endpoint to allow the bot to create and update tickets in our CRM.', parentId: null, createdAt: '2024-07-30T15:00:00Z' },
    { taskId: 'TASK-306', taskName: 'Design Chat Widget UI', project: 'AI Customer Support Bot', assignee: 'Olivia Chen', status: 'To Do', subStatus: 'Pending', priority: 'Medium', startDate: '2024-08-05', dueDate: '2024-08-12', completionDate: null, description: 'Design the front-end chat widget that will be embedded on the website.', parentId: null, createdAt: '2024-08-02T12:00:00Z' },
    { taskId: 'TASK-307', taskName: 'Conduct Internal Beta Test', project: 'AI Customer Support Bot', assignee: 'Ava Nguyen', status: 'Backlog', subStatus: 'Pending', priority: 'High', startDate: null, dueDate: null, completionDate: null, description: 'Plan and execute a beta test with internal employees to gather feedback on the bot\'s accuracy and usability.', parentId: null, createdAt: '2024-08-01T17:00:00Z' },
    { taskId: 'TASK-308', taskName: 'Implement user feedback mechanism in chat widget', project: 'AI Customer Support Bot', assignee: 'Olivia Chen', status: 'To Do', subStatus: 'Pending', priority: 'Medium', startDate: '2024-08-13', dueDate: '2024-08-19', completionDate: null, description: 'Add a thumbs up/down feedback option after the bot provides an answer to collect user satisfaction data.', parentId: 'TASK-306', createdAt: '2024-08-12T10:00:00Z' },
    { taskId: 'TASK-309', taskName: 'Write unit tests for CRM integration API', project: 'AI Customer Support Bot', assignee: 'Mason Williams', status: 'In Progress', subStatus: 'In Progress', priority: 'Medium', startDate: '2024-08-16', dueDate: '2024-08-22', completionDate: null, description: 'Ensure the API for creating and updating tickets in the CRM is robust and error-free.', parentId: 'TASK-305', createdAt: '2024-08-15T11:00:00Z' },
    { taskId: 'TASK-310', taskName: 'Stress test the model with 10k concurrent users', project: 'AI Customer Support Bot', assignee: 'Ethan James', status: 'Backlog', subStatus: 'Pending', priority: 'High', startDate: null, dueDate: null, completionDate: null, description: 'Use a load testing tool to simulate high traffic and measure the AI model\'s response latency and stability.', parentId: null, createdAt: '2024-08-16T14:00:00Z' },
    { taskId: 'TASK-311', taskName: 'Draft internal announcement for beta test', project: 'AI Customer Support Bot', assignee: 'Ava Nguyen', status: 'To Do', subStatus: 'Pending', priority: 'Low', startDate: '2024-08-15', dueDate: '2024-08-16', completionDate: null, description: 'Write an email to all employees inviting them to participate in the internal beta test of the new support bot.', parentId: 'TASK-307', createdAt: '2024-08-14T16:00:00Z' },
    
    // --- Project: Internal HR Portal ---
    { taskId: 'TASK-401', taskName: 'Gather Requirements from HR Team', project: 'Internal HR Portal', assignee: 'Sophia Rodriguez', status: 'To Do', subStatus: 'Pending', priority: 'High', startDate: '2024-08-01', dueDate: '2024-08-07', completionDate: null, description: 'Conduct interviews with the HR department to document all necessary features and workflows.', parentId: null, createdAt: '2024-07-31T09:00:00Z' },
    { taskId: 'TASK-402', taskName: 'Create User Personas & Journey Maps', project: 'Internal HR Portal', assignee: 'Liam Goldberg', status: 'To Do', subStatus: 'Pending', priority: 'Medium', startDate: '2024-08-08', dueDate: '2024-08-14', completionDate: null, description: 'Develop personas for different employee roles and map out their journeys through the portal.', parentId: null, createdAt: '2024-08-02T10:00:00Z' },
    { taskId: 'TASK-403', taskName: 'Wireframe PTO Request Flow', project: 'Internal HR Portal', assignee: 'Liam Goldberg', status: 'Backlog', subStatus: 'Pending', priority: 'High', startDate: null, dueDate: null, completionDate: null, description: 'Create low-fidelity wireframes for the entire process of requesting and approving time off.', parentId: null, createdAt: '2024-08-05T11:00:00Z' },
    { taskId: 'TASK-404', taskName: 'Evaluate Third-Party Payroll APIs', project: 'Internal HR Portal', assignee: 'Mason Williams', status: 'Backlog', subStatus: 'Pending', priority: 'Medium', startDate: null, dueDate: null, completionDate: null, description: 'Research and compare APIs from providers like Gusto and Rippling for integration.', parentId: null, createdAt: '2024-08-06T14:00:00Z' },
    { taskId: 'TASK-405', taskName: 'Choose Tech Stack (React vs Vue)', project: 'Internal HR Portal', assignee: 'Olivia Chen', status: 'Backlog', subStatus: 'Pending', priority: 'Medium', startDate: null, dueDate: null, completionDate: null, description: 'Create a decision document comparing the pros and cons of different frontend frameworks.', parentId: null, createdAt: '2024-08-07T15:00:00Z' },
    { taskId: 'TASK-406', taskName: 'Design database schema for employee data', project: 'Internal HR Portal', assignee: 'Mason Williams', status: 'To Do', subStatus: 'Pending', priority: 'High', startDate: '2024-08-15', dueDate: '2024-08-21', completionDate: null, description: 'Define the database tables and relationships needed to store employee information securely.', parentId: null, createdAt: '2024-08-14T09:00:00Z' },
    { taskId: 'TASK-407', taskName: 'Create high-fidelity mockups for benefits enrollment', project: 'Internal HR Portal', assignee: 'Olivia Chen', status: 'To Do', subStatus: 'Pending', priority: 'Medium', startDate: '2024-08-19', dueDate: '2024-08-26', completionDate: null, description: 'Design the detailed UI for the benefits enrollment workflow using Figma.', parentId: null, createdAt: '2024-08-16T10:00:00Z' },
    { taskId: 'TASK-408', taskName: 'Setup CI/CD pipeline for the portal', project: 'Internal HR Portal', assignee: 'Ethan James', status: 'Backlog', subStatus: 'Pending', priority: 'Medium', startDate: null, dueDate: null, completionDate: null, description: 'Configure GitHub Actions to automatically build, test, and deploy the portal to a staging environment.', parentId: null, createdAt: '2024-08-19T11:00:00Z' },
    { taskId: 'TASK-409', taskName: 'Write end-to-end tests for PTO flow', project: 'Internal HR Portal', assignee: 'Ava Nguyen', status: 'Backlog', subStatus: 'Pending', priority: 'High', startDate: null, dueDate: null, completionDate: null, description: 'Use Cypress to create automated tests that cover the entire PTO request and approval process.', parentId: 'TASK-403', createdAt: '2024-08-20T14:00:00Z' },

    // --- Project: 2025 Annual Company Retreat ---
    { taskId: 'TASK-501', taskName: 'Finalize budget and get approval', project: '2025 Annual Company Retreat', assignee: 'Liam Goldberg', status: 'Backlog', subStatus: 'Pending', priority: 'Urgent', startDate: null, dueDate: null, completionDate: null, description: 'Create a detailed budget proposal for the retreat and get it approved by finance.', parentId: null, createdAt: '2024-08-01T18:00:00Z' },
    { taskId: 'TASK-502', taskName: 'Research and shortlist potential venues', project: '2025 Annual Company Retreat', assignee: 'Sophia Rodriguez', status: 'Backlog', subStatus: 'Pending', priority: 'High', startDate: null, dueDate: null, completionDate: null, description: 'Find and get quotes from at least 3 potential venues in the target location.', parentId: null, createdAt: '2024-08-02T19:00:00Z' },
    { taskId: 'TASK-503', taskName: 'Brainstorm theme ideas', project: '2025 Annual Company Retreat', assignee: 'Liam Goldberg', status: 'Backlog', subStatus: 'Pending', priority: 'Medium', startDate: null, dueDate: null, completionDate: null, description: 'Hold a brainstorming session to come up with potential themes for the retreat.', parentId: null, createdAt: '2024-08-03T20:00:00Z' },
    { taskId: 'TASK-504', taskName: 'Send out employee survey for preferences', project: '2025 Annual Company Retreat', assignee: 'Sophia Rodriguez', status: 'Backlog', subStatus: 'Pending', priority: 'Low', startDate: null, dueDate: null, completionDate: null, description: 'Create and distribute a survey to gauge employee interest in different activities and locations.', parentId: null, createdAt: '2024-08-04T21:00:00Z' },
    { taskId: 'TASK-505', taskName: 'Negotiate contract with preferred venue', project: '2025 Annual Company Retreat', assignee: 'Liam Goldberg', status: 'To Do', subStatus: 'Pending', priority: 'Urgent', startDate: '2024-08-10', dueDate: '2024-08-17', completionDate: null, description: 'Negotiate pricing and terms with the top venue choice from the shortlist.', parentId: 'TASK-502', createdAt: '2024-08-09T10:00:00Z' },
    { taskId: 'TASK-506', taskName: 'Plan team-building activities', project: '2025 Annual Company Retreat', assignee: 'Sophia Rodriguez', status: 'To Do', subStatus: 'Pending', priority: 'Medium', startDate: '2024-08-12', dueDate: '2024-08-26', completionDate: null, description: 'Brainstorm and schedule a variety of team-building activities suitable for all employees.', parentId: 'TASK-503', createdAt: '2024-08-10T11:00:00Z' },
    { taskId: 'TASK-507', taskName: 'Arrange transportation logistics', project: '2025 Annual Company Retreat', assignee: 'Liam Goldberg', status: 'Backlog', subStatus: 'Pending', priority: 'Medium', startDate: null, dueDate: null, completionDate: null, description: 'Get quotes and book charter buses or flights for all employees.', parentId: null, createdAt: '2024-08-12T15:00:00Z' },
    { taskId: 'TASK-508', taskName: 'Design and order company swag for the retreat', project: '2025 Annual Company Retreat', assignee: 'Sophia Rodriguez', status: 'Backlog', subStatus: 'Pending', priority: 'Low', startDate: null, dueDate: null, completionDate: null, description: 'Design custom t-shirts, water bottles, and other swag for the event and place the order.', parentId: null, createdAt: '2024-08-14T12:00:00Z' },
  ];

  const MOCK_TEAM: TeamMember[] = [
    { name: 'Olivia Chen', email: 'olivia.chen@example.com' },
    { name: 'Ben Carter', email: 'ben.carter@example.com' },
    { name: 'Sophia Rodriguez', email: 'sophia.rodriguez@example.com' },
    { name: 'Liam Goldberg', email: 'liam.goldberg@example.com' },
    { name: 'Ava Nguyen', email: 'ava.nguyen@example.com' },
    { name: 'Mason Williams', email: 'mason.williams@example.com' },
    { name: 'Ethan James', email: 'ethan.james@example.com' },
  ];
  
  let MOCK_COMMENTS: ProjectComment[] = [
    {
        commentId: 'COMMENT-1',
        projectId: 'PROJ-1',
        author: 'Olivia Chen',
        content: 'Met with the design team to finalize the color palette and typography. We have a solid direction now. Will upload the final style guide tomorrow.',
        createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: null,
        visibility: 'Public',
        taggedUsers: ['Mason Williams', 'Ava Nguyen'],
        parentId: null,
        taskId: null,
    },
    {
        commentId: 'COMMENT-2',
        projectId: 'PROJ-1',
        author: 'Mason Williams',
        content: 'Finished the initial build of the Button component. Ran into some issues with Safari focus states, need to investigate further. It\'s usable for now but needs polishing.',
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: null,
        visibility: 'Public',
        taggedUsers: ['Olivia Chen'],
        parentId: null,
        taskId: 'TASK-102',
    },
     {
        commentId: 'COMMENT-3',
        projectId: 'PROJ-1',
        author: 'Ava Nguyen',
        content: '[REPLY_TO:COMMENT-2] Have you tried using `:focus-visible` instead of just `:focus`? That usually solves cross-browser focus inconsistencies for me.',
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + 3600000).toISOString(),
        updatedAt: null,
        visibility: 'Public',
        taggedUsers: ['Mason Williams'],
        parentId: null,
        taskId: 'TASK-102',
    },
    {
        commentId: 'COMMENT-4',
        projectId: 'PROJ-1',
        author: 'Olivia Chen',
        content: 'I\'m a bit concerned about the timeline for the documentation. We might need to allocate more resources to it. Will bring it up in the next sync.',
        createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: null,
        visibility: 'Private',
        taggedUsers: [],
        parentId: null,
        taskId: null,
    },
    {
        commentId: 'COMMENT-5',
        projectId: 'PROJ-1',
        author: 'Mason Williams',
        content: `[REPLY_TO:COMMENT-3] Great suggestion @Ava Nguyen! That fixed the Safari issue completely. Pushing the fix now. The button component is officially ready for review.`,
        createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000 + 7200000).toISOString(),
        updatedAt: null,
        visibility: 'Public',
        taggedUsers: ['Ava Nguyen', 'Olivia Chen'],
        parentId: null,
        taskId: 'TASK-102',
    },
     {
        commentId: 'COMMENT-6',
        projectId: 'PROJ-2',
        author: 'Ben Carter',
        content: `Just got off the phone with the PR agency. They're excited about the 'Odyssey' launch and have already pitched it to three major tech publications. Fingers crossed for some good coverage!`,
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: null,
        visibility: 'Public',
        taggedUsers: ['Sophia Rodriguez'],
        parentId: null,
        taskId: null,
    },
     {
        commentId: 'COMMENT-7',
        projectId: 'PROJ-1',
        author: 'Olivia Chen',
        content: 'Reviewed Mason\'s PR for the button component. Left a few comments regarding accessibility aria-labels. Looking good otherwise!',
        createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: null,
        visibility: 'Public',
        taggedUsers: ['Mason Williams'],
        parentId: null,
        taskId: 'TASK-102',
    },
     {
        commentId: 'COMMENT-8',
        projectId: 'PROJ-3',
        author: 'Ava Nguyen',
        content: `Initial training run of the intent recognition model is complete. Accuracy is at about 82%, which is a decent start. We need to feed it more varied data, especially around billing questions, to improve performance. @Mason Williams how's the data ingestion script coming along?`,
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: null,
        visibility: 'Public',
        taggedUsers: ['Mason Williams'],
        parentId: null,
        taskId: 'TASK-304',
    },
    {
        commentId: 'COMMENT-9',
        projectId: 'PROJ-3',
        author: 'Mason Williams',
        content: `The knowledge base ingestion script is almost done. Had to handle some weird HTML formatting in the old articles. Should be ready to run on the full dataset by EOD tomorrow.`,
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: null,
        visibility: 'Public',
        taggedUsers: ['Ava Nguyen'],
        parentId: 'COMMENT-8',
        taskId: 'TASK-303',
    },
     {
        commentId: 'COMMENT-10',
        projectId: 'PROJ-2',
        author: 'Sophia Rodriguez',
        content: `The first draft of the press release is ready for review. @Ben Carter could you give it a once-over before I send it for final approval? It's in the shared drive.`,
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: null,
        visibility: 'Public',
        taggedUsers: ['Ben Carter'],
        parentId: null,
        taskId: 'TASK-202',
    },
    {
        commentId: 'COMMENT-11',
        projectId: 'PROJ-1',
        author: 'Olivia Chen',
        content: `Team, quick update: The Modal component is now in review and I've started scaffolding the documentation. We're making great progress. Let's keep the momentum going!`,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        updatedAt: null,
        visibility: 'Public',
        taggedUsers: ['Mason Williams', 'Ava Nguyen'],
        parentId: null,
        taskId: null,
    },
        // ---- TASK-SPECIFIC DUMMY COMMENTS ----
    // --- TASK-104: Build Modal Component ---
    {
        commentId: 'COMMENT-104-1',
        projectId: 'PROJ-1',
        author: 'Olivia Chen',
        content: 'The initial PR for the modal component is up for review. @Ava Nguyen can you take a look when you have a moment?',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: null,
        visibility: 'Public',
        taggedUsers: ['Ava Nguyen'],
        parentId: null,
        taskId: 'TASK-104',
    },
    {
        commentId: 'COMMENT-104-2',
        projectId: 'PROJ-1',
        author: 'Ava Nguyen',
        content: "Looks great, Olivia! Just left a few minor comments about keyboard accessibility. Should be a quick fix.",
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 3600000).toISOString(),
        updatedAt: null,
        visibility: 'Public',
        taggedUsers: ['Olivia Chen'],
        parentId: 'COMMENT-104-1',
        taskId: 'TASK-104',
    },
    {
        commentId: 'COMMENT-104-3',
        projectId: 'PROJ-1',
        author: 'Mason Williams',
        content: "This looks solid. Will this component be used in the new HR portal?",
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 7200000).toISOString(),
        updatedAt: null,
        visibility: 'Public',
        taggedUsers: ['Olivia Chen'],
        parentId: null,
        taskId: 'TASK-104',
    },
    {
        commentId: 'COMMENT-104-4',
        projectId: 'PROJ-1',
        author: 'Olivia Chen',
        content: "Thanks for the feedback! And yes, @Mason Williams, that's the plan. We'll need to make sure it's flexible enough for their forms.",
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: null,
        visibility: 'Public',
        taggedUsers: ['Mason Williams'],
        parentId: 'COMMENT-104-3',
        taskId: 'TASK-104',
    },
    // --- TASK-105: Write Documentation ---
    {
        commentId: 'COMMENT-105-1',
        projectId: 'PROJ-1',
        author: 'Olivia Chen',
        content: "Started on the Storybook setup. It's taking a bit longer than expected to configure.",
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: null,
        visibility: 'Public',
        taggedUsers: [],
        parentId: null,
        taskId: 'TASK-105',
    },
    {
        commentId: 'COMMENT-105-2',
        projectId: 'PROJ-1',
        author: 'Mason Williams',
        content: "Do you need any help with the Webpack config? I've wrangled with it before.",
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 3600000).toISOString(),
        updatedAt: null,
        visibility: 'Public',
        taggedUsers: ['Olivia Chen'],
        parentId: null,
        taskId: 'TASK-105',
    },
    {
        commentId: 'COMMENT-105-3',
        projectId: 'PROJ-1',
        author: 'Olivia Chen',
        content: "That would be a lifesaver, thanks Mason! I'm stuck on getting the SCSS loaders to work correctly.",
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: null,
        visibility: 'Public',
        taggedUsers: ['Mason Williams'],
        parentId: 'COMMENT-105-2',
        taskId: 'TASK-105',
    },
    {
        commentId: 'COMMENT-105-4',
        projectId: 'PROJ-1',
        author: 'Ava Nguyen',
        content: "Once the setup is done, I can help write the docs for the components I built.",
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: null,
        visibility: 'Public',
        taggedUsers: ['Olivia Chen'],
        parentId: null,
        taskId: 'TASK-105',
    },
    // --- TASK-203: Social Media Ad Creatives ---
    {
        commentId: 'COMMENT-203-1',
        projectId: 'PROJ-2',
        author: 'Liam Goldberg',
        content: "First batch of ad creatives for LinkedIn and Twitter are in the shared drive for review. @Ben Carter let me know what you think.",
        createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: null,
        visibility: 'Public',
        taggedUsers: ['Ben Carter'],
        parentId: null,
        taskId: 'TASK-203',
    },
    {
        commentId: 'COMMENT-203-2',
        projectId: 'PROJ-2',
        author: 'Ben Carter',
        content: "These look amazing! The branding is spot on. Let's maybe try a version with a stronger call to action on the Twitter creative.",
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: null,
        visibility: 'Public',
        taggedUsers: ['Liam Goldberg'],
        parentId: 'COMMENT-203-1',
        taskId: 'TASK-203',
    },
    {
        commentId: 'COMMENT-203-3',
        projectId: 'PROJ-2',
        author: 'Sophia Rodriguez',
        content: "Love the visuals. The copy is great too, really speaks to our target audience.",
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 3600000).toISOString(),
        updatedAt: null,
        visibility: 'Public',
        taggedUsers: ['Liam Goldberg'],
        parentId: null,
        taskId: 'TASK-203',
    },
    {
        commentId: 'COMMENT-203-4',
        projectId: 'PROJ-2',
        author: 'Liam Goldberg',
        content: "Good call, Ben. I'll tweak the CTA and upload a v2.",
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: null,
        visibility: 'Public',
        taggedUsers: ['Ben Carter'],
        parentId: 'COMMENT-203-2',
        taskId: 'TASK-203',
    },
    // --- TASK-205: Launch Landing Page ---
    {
        commentId: 'COMMENT-205-1',
        projectId: 'PROJ-2',
        author: 'Olivia Chen',
        content: "Just pushed the wireframes for the landing page. Feedback is welcome!",
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: null,
        visibility: 'Public',
        taggedUsers: [],
        parentId: null,
        taskId: 'TASK-205',
    },
    {
        commentId: 'COMMENT-205-2',
        projectId: 'PROJ-2',
        author: 'Ben Carter',
        content: "This structure looks perfect. It highlights all the key features right at the top.",
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 3600000).toISOString(),
        updatedAt: null,
        visibility: 'Public',
        taggedUsers: ['Olivia Chen'],
        parentId: 'COMMENT-205-1',
        taskId: 'TASK-205',
    },
    {
        commentId: 'COMMENT-205-3',
        projectId: 'PROJ-2',
        author: 'Sophia Rodriguez',
        content: "Can we make the 'Sign up for early access' form more prominent?",
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: null,
        visibility: 'Public',
        taggedUsers: ['Olivia Chen'],
        parentId: null,
        taskId: 'TASK-205',
    },
    {
        commentId: 'COMMENT-205-4',
        projectId: 'PROJ-2',
        author: 'Olivia Chen',
        content: "Absolutely. I'll move it above the fold in the next iteration. Thanks, @Sophia Rodriguez!",
        createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
        updatedAt: null,
        visibility: 'Public',
        taggedUsers: ['Sophia Rodriguez'],
        parentId: 'COMMENT-205-3',
        taskId: 'TASK-205',
    },
    // --- TASK-401: Gather Requirements from HR ---
    {
        commentId: 'COMMENT-401-1',
        projectId: 'PROJ-4',
        author: 'Sophia Rodriguez',
        content: "Meeting with the HR team is scheduled for this Wednesday. I've prepared a list of discovery questions.",
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: null,
        visibility: 'Public',
        taggedUsers: [],
        parentId: null,
        taskId: 'TASK-401',
    },
    {
        commentId: 'COMMENT-401-2',
        projectId: 'PROJ-4',
        author: 'Liam Goldberg',
        content: "Want me to sit in? I have some ideas about the UI for the PTO request flow.",
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: null,
        visibility: 'Public',
        taggedUsers: ['Sophia Rodriguez'],
        parentId: null,
        taskId: 'TASK-401',
    },
    {
        commentId: 'COMMENT-401-3',
        projectId: 'PROJ-4',
        author: 'Sophia Rodriguez',
        content: "That would be great, thanks @Liam Goldberg. More perspectives are always helpful.",
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 3600000).toISOString(),
        updatedAt: null,
        visibility: 'Public',
        taggedUsers: ['Liam Goldberg'],
        parentId: 'COMMENT-401-2',
        taskId: 'TASK-401',
    },
    {
        commentId: 'COMMENT-401-4',
        projectId: 'PROJ-4',
        author: 'Sophia Rodriguez',
        content: "The meeting went well! We have a much clearer picture of the MVP features now. I'll write up the notes and share them.",
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: null,
        visibility: 'Public',
        taggedUsers: [],
        parentId: null,
        taskId: 'TASK-401',
    },
    {
        commentId: 'COMMENT-12',
        projectId: 'PROJ-1',
        author: 'Ethan James',
        content: "Hey team! Just joined the project. Excited to be here and looking forward to helping out with the Phoenix library. I'll be picking up the performance audit task to get started.",
        createdAt: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(),
        updatedAt: null,
        visibility: 'Public',
        taggedUsers: ['Olivia Chen'],
        parentId: null,
        taskId: null,
    },
    {
        commentId: 'COMMENT-13',
        projectId: 'PROJ-1',
        author: 'Olivia Chen',
        content: "Welcome to the team, @Ethan James! Glad to have you on board. Let me know if you need any help getting up to speed with the codebase.",
        createdAt: new Date(Date.now() - 19 * 60 * 60 * 1000).toISOString(),
        updatedAt: null,
        visibility: 'Public',
        taggedUsers: ['Ethan James'],
        parentId: 'COMMENT-12',
        taskId: null,
    },
    {
        commentId: 'COMMENT-14',
        projectId: 'PROJ-2',
        author: 'Ben Carter',
        content: "Great news - the venue for the Odyssey launch event is officially booked! Contract signed. Now we can move forward with finalizing the guest list.",
        createdAt: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(),
        updatedAt: null,
        visibility: 'Public',
        taggedUsers: ['Liam Goldberg', 'Sophia Rodriguez'],
        parentId: null,
        taskId: 'TASK-208',
    },
    {
        commentId: 'COMMENT-15',
        projectId: 'PROJ-4',
        author: 'Olivia Chen',
        content: "The first high-fidelity mockups for the benefits enrollment page are in Figma. Would love some early feedback when you have a chance, @Sophia Rodriguez.",
        createdAt: new Date(Date.now() - 15 * 60 * 60 * 1000).toISOString(),
        updatedAt: null,
        visibility: 'Public',
        taggedUsers: ['Sophia Rodriguez'],
        parentId: null,
        taskId: 'TASK-407',
    },
    {
        commentId: 'COMMENT-16',
        projectId: 'PROJ-1',
        author: 'Ava Nguyen',
        content: "Just started working on the visual regression testing setup. This should really help us catch UI bugs before they get to production.",
        createdAt: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
        updatedAt: null,
        visibility: 'Public',
        taggedUsers: ['Olivia Chen'],
        parentId: null,
        taskId: 'TASK-108',
    },
     {
        commentId: 'COMMENT-17',
        projectId: 'PROJ-4',
        author: 'Sophia Rodriguez',
        content: "The mockups are looking fantastic, @Olivia Chen! This is exactly what we discussed. The flow is very intuitive.",
        createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
        updatedAt: null,
        visibility: 'Public',
        taggedUsers: ['Olivia Chen'],
        parentId: 'COMMENT-15',
        taskId: 'TASK-407',
    },
  ];

  // This object simulates the server-side functions in code.gs
  const mockApi = {
    getInitialData: (): Promise<any> => {
      if (!devCache) {
        devCache = { tasks: MOCK_TASKS, projects: MOCK_PROJECTS, team: MOCK_TEAM, comments: MOCK_COMMENTS };
      }
      return new Promise(resolve => setTimeout(() => resolve(JSON.parse(JSON.stringify(devCache))), 500));
    },
     addNewUser: (userData: { name: string; email: string }): Promise<TeamMember> => {
      return new Promise(resolve => {
        if (devCache.team.some((u: TeamMember) => u.email === userData.email)) {
            console.warn(`User with email ${userData.email} already exists.`);
        }
        const newUser: TeamMember = {
            name: userData.name,
            email: userData.email,
        };
        devCache.team.push(newUser);
        setTimeout(() => resolve(newUser), 300);
      });
    },
    addNewProject: (projectData: { projectName: string, projectLead: string, description: string, members: string[] }): Promise<Project> => {
       return new Promise(resolve => {
            const newProject: Project = {
                ...projectData,
                projectId: `PROJ-${Date.now()}`,
                status: 'Active',
            };
            devCache.projects.unshift(newProject);
            setTimeout(() => resolve(newProject), 300);
       });
    },
    updateTaskStatus: (taskId: string, newStatus: TaskStatus, completionDate: string | null): Promise<void> => {
        return new Promise(resolve => {
            devCache.tasks = devCache.tasks.map((t: Task) => t.taskId === taskId ? { ...t, status: newStatus, completionDate: completionDate } : t);
            setTimeout(() => resolve(), 200);
        });
    },
    updateTask: (taskId: string, taskData: Partial<Task>): Promise<Task> => {
        return new Promise((resolve, reject) => {
            const taskIndex = devCache.tasks.findIndex((t: Task) => t.taskId === taskId);
            if (taskIndex > -1) {
                const updatedTask = { ...devCache.tasks[taskIndex], ...taskData };
                devCache.tasks[taskIndex] = updatedTask;
                setTimeout(() => resolve(updatedTask), 200);
            } else {
                reject(new Error("Task not found"));
            }
        });
    },
    addTasks: (tasks: Partial<Task>[]): Promise<void> => {
        return new Promise(resolve => {
            const newTasks: Task[] = tasks.map((task, i) => ({
                taskId: `TASK-${Date.now()}-${i}`,
                taskName: task.taskName || 'Untitled Task',
                project: task.project || '',
                assignee: task.assignee || '',
                status: 'To Do',
                subStatus: 'Pending',
                priority: task.priority || 'Medium',
                startDate: new Date().toISOString(),
                dueDate: null,
                completionDate: null,
                description: task.description || '',
                parentId: null,
                createdAt: new Date().toISOString(),
            }));
            devCache.tasks.push(...newTasks);
            setTimeout(() => resolve(), 300);
        });
    },
    addNewTask: (taskData: Partial<Task>): Promise<Task> => {
        return new Promise(resolve => {
            const newTask: Task = {
                taskId: `TASK-${Date.now()}`,
                taskName: taskData.taskName || 'Untitled Task',
                project: taskData.project || '',
                assignee: taskData.assignee || '',
                status: taskData.status || 'To Do',
                subStatus: 'Pending',
                priority: taskData.priority || 'Medium',
                startDate: taskData.startDate || null,
                dueDate: taskData.dueDate || null,
                completionDate: null,
                description: taskData.description || '',
                parentId: null,
                createdAt: new Date().toISOString(),
            };
            devCache.tasks.push(newTask);
            setTimeout(() => resolve(newTask), 200);
        });
    },
    addNewComment: (commentData: Omit<ProjectComment, 'commentId' | 'createdAt'>): Promise<ProjectComment> => {
        return new Promise(resolve => {
            const newComment: ProjectComment = {
                ...commentData,
                commentId: `COMMENT-${Date.now()}`,
                createdAt: new Date().toISOString(),
                updatedAt: null,
                parentId: commentData.parentId || null,
                taskId: commentData.taskId || null,
            };
            devCache.comments.push(newComment);
            setTimeout(() => resolve(newComment), 200);
        });
    },
    updateCommentContent: (commentId: string, newContent: string, newTaggedUsers: string[]): Promise<ProjectComment> => {
        return new Promise((resolve, reject) => {
            const commentIndex = devCache.comments.findIndex((c: ProjectComment) => c.commentId === commentId);
            if (commentIndex > -1) {
                const updatedComment = {
                    ...devCache.comments[commentIndex],
                    content: newContent,
                    taggedUsers: newTaggedUsers,
                    updatedAt: new Date().toISOString(),
                };
                devCache.comments[commentIndex] = updatedComment;
                setTimeout(() => resolve(updatedComment), 200);
            } else {
                reject(new Error("Comment not found"));
            }
        });
    },
    updateProject: (projectId: string, projectData: Partial<Project>): Promise<Project> => {
        return new Promise((resolve, reject) => {
            const projectIndex = devCache.projects.findIndex((p: Project) => p.projectId === projectId);
            if (projectIndex > -1) {
                const originalProjectName = devCache.projects[projectIndex].projectName;
                const updatedProject = { ...devCache.projects[projectIndex], ...projectData };
                devCache.projects[projectIndex] = updatedProject;
                
                // If project name changed, update tasks
                if (projectData.projectName && projectData.projectName !== originalProjectName) {
                    devCache.tasks = devCache.tasks.map((t: Task) => {
                        if (t.project === originalProjectName) {
                            return { ...t, project: projectData.projectName };
                        }
                        return t;
                    });
                }

                setTimeout(() => resolve(updatedProject), 200);
            } else {
                reject(new Error("Project not found"));
            }
        });
    },
    deleteProject: (projectId: string): Promise<void> => {
        return new Promise(resolve => {
            const projectToDelete = devCache.projects.find((p: Project) => p.projectId === projectId);
            if (projectToDelete) {
                devCache.projects = devCache.projects.filter((p: Project) => p.projectId !== projectId);
                devCache.tasks = devCache.tasks.filter((t: Task) => t.project !== projectToDelete.projectName);
                devCache.comments = devCache.comments.filter((c: ProjectComment) => c.projectId !== projectId);
            }
            setTimeout(() => resolve(), 300);
        });
    },
    deleteTask: (taskId: string): Promise<void> => {
        return new Promise(resolve => {
            devCache.tasks = devCache.tasks.filter((t: Task) => t.taskId !== taskId);
            devCache.comments = devCache.comments.filter((c: ProjectComment) => c.taskId !== taskId);
            setTimeout(() => resolve(), 200);
        });
    },
    deleteComment: (commentId: string): Promise<void> => {
        return new Promise(resolve => {
            const commentsToDelete = new Set<string>([commentId]);
            let changed = true;
            // Find all replies recursively to delete them too
            while(changed) {
                changed = false;
                const currentSize = commentsToDelete.size;
                devCache.comments.forEach((c: ProjectComment) => {
                    if (c.parentId && commentsToDelete.has(c.parentId)) {
                        commentsToDelete.add(c.commentId);
                    }
                });
                if(commentsToDelete.size > currentSize) {
                    changed = true;
                }
            }

            devCache.comments = devCache.comments.filter((c: ProjectComment) => !commentsToDelete.has(c.commentId));
            setTimeout(() => resolve(), 200);
        });
    },
  };
  
  // This factory function correctly mimics the google.script.run API
  const createMockServerRunner = () => {
      const runnerTemplate: any = {};
      Object.keys(mockApi).forEach(key => {
          runnerTemplate[key] = function(...args: any[]) {
              const promise = (mockApi as any)[key](...args);
              // Store handlers in closure
              let successHandler: (result: any) => void;
              let failureHandler: (error: Error) => void;
              
              // Chainable methods to set handlers
              const runner = {
                  withSuccessHandler: (callback: (result: any) => void) => {
                      successHandler = callback;
                      return runner;
                  },
                  withFailureHandler: (callback: (error: Error) => void) => {
                      failureHandler = callback;
                      return runner;
                  }
              };
              
              // Execute the promise
              promise.then(result => {
                  if (successHandler) successHandler(result);
              }).catch(err => {
                  if (failureHandler) {
                      failureHandler(err);
                  } else {
                      console.error('Mock server error:', err);
                  }
              });

              // Return the chainable object
              return runner;
          };
      });

      return runnerTemplate;
  };

  
  server = createMockServerRunner();
}

// Public API
type InitialData = {
    tasks: Task[];
    projects: Project[];
    team: TeamMember[];
    comments: ProjectComment[];
};

export const getInitialData = (): Promise<InitialData> => {
  return new Promise((resolve, reject) => {
    server.getInitialData()
      .withSuccessHandler(resolve)
      .withFailureHandler(reject);
  });
};

export const addNewUser = (userData: { name: string, email: string }): Promise<TeamMember> => {
    return new Promise((resolve, reject) => {
        server.addNewUser(userData)
            .withSuccessHandler(resolve)
            .withFailureHandler(reject);
    });
};

export const addNewProject = (projectData: { projectName: string, projectLead: string, description: string, members: string[] }): Promise<Project> => {
    return new Promise((resolve, reject) => {
        server.addNewProject(projectData)
            .withSuccessHandler(resolve)
            .withFailureHandler(reject);
    });
};

export const updateTaskStatus = (taskId: string, newStatus: TaskStatus, completionDate: string | null): Promise<void> => {
    return new Promise((resolve, reject) => {
        server.updateTaskStatus(taskId, newStatus, completionDate)
            .withSuccessHandler(resolve)
            .withFailureHandler(reject);
    });
};

export const updateTask = (taskId: string, taskData: Partial<Task>): Promise<Task> => {
    return new Promise((resolve, reject) => {
        server.updateTask(taskId, taskData)
            .withSuccessHandler(resolve)
            .withFailureHandler(reject);
    });
};

export const addTasks = (tasks: Partial<Task>[]): Promise<void> => {
    return new Promise((resolve, reject) => {
        server.addTasks(tasks)
            .withSuccessHandler(resolve)
            .withFailureHandler(reject);
    });
};

export const addNewTask = (taskData: Partial<Task>): Promise<Task> => {
    return new Promise((resolve, reject) => {
        server.addNewTask(taskData)
            .withSuccessHandler(resolve)
            .withFailureHandler(reject);
    });
}

export const addNewComment = (commentData: Omit<ProjectComment, 'commentId' | 'createdAt'>): Promise<ProjectComment> => {
    return new Promise((resolve, reject) => {
        server.addNewComment(commentData)
            .withSuccessHandler(resolve)
            .withFailureHandler(reject);
    });
};

export const updateComment = (commentId: string, newContent: string, newTaggedUsers: string[]): Promise<ProjectComment> => {
    return new Promise((resolve, reject) => {
        server.updateCommentContent(commentId, newContent, newTaggedUsers)
            .withSuccessHandler(resolve)
            .withFailureHandler(reject);
    });
};

export const updateProject = (projectId: string, projectData: Partial<Project>): Promise<Project> => {
    return new Promise((resolve, reject) => {
        server.updateProject(projectId, projectData)
            .withSuccessHandler(resolve)
            .withFailureHandler(reject);
    });
};

export const deleteProject = (projectId: string): Promise<void> => {
    return new Promise((resolve, reject) => {
        server.deleteProject(projectId)
            .withSuccessHandler(resolve)
            .withFailureHandler(reject);
    });
};

export const deleteTask = (taskId: string): Promise<void> => {
    return new Promise((resolve, reject) => {
        server.deleteTask(taskId)
            .withSuccessHandler(resolve)
            .withFailureHandler(reject);
    });
};

export const deleteComment = (commentId: string): Promise<void> => {
    return new Promise((resolve, reject) => {
        server.deleteComment(commentId)
            .withSuccessHandler(resolve)
            .withFailureHandler(reject);
    });
};