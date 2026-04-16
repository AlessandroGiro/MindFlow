import React from 'react';

interface SystemDocumentationProps {
    onToggleSidebar: () => void;
}

const DocSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-base-200 p-6 rounded-2xl shadow-sm">
        <h3 className="text-xl font-bold mb-4 pb-2 border-b border-base-300">{title}</h3>
        {children}
    </div>
);

const CostInfo: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="mt-4 p-4 border-l-4 border-brand-primary/50 bg-base-100 dark:bg-zinc-900 rounded-r-lg">
        <h5 className="font-bold text-base mb-2">{title}</h5>
        {children}
    </div>
);

export const SystemDocumentation: React.FC<SystemDocumentationProps> = ({ onToggleSidebar }) => {
    return (
        <div>
            <header className="mb-6">
                 <div className="flex items-center gap-2">
                     <button onClick={onToggleSidebar} className="p-2 -ml-2 rounded-full hover:bg-base-300 md:hidden" aria-label="Toggle menu">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                        </svg>
                    </button>
                    <div>
                        <h1 className="text-3xl sm:text-4xl font-bold">System Documentation</h1>
                        <p className="text-base-content-secondary mt-1">Technical guide for backend setup and architecture.</p>
                    </div>
                </div>
            </header>
            <div className="space-y-6 max-w-4xl">
                <DocSection title="Backend Setup with GCP & BigQuery">
                    <div className="text-base-content/90 space-y-4 text-sm prose prose-sm dark:prose-invert max-w-none">
                        <p>This guide provides a detailed walkthrough for building a scalable, serverless backend for the ProjectFlow application using Google Cloud Platform. This architecture leverages Cloud Functions for compute and BigQuery as a data warehouse, offering a cost-effective and low-maintenance solution suitable for production environments.</p>
                        
                        <h4>Prerequisites</h4>
                        <ul>
                            <li>A Google Cloud Platform (GCP) account with an active billing account enabled.</li>
                            <li>The <code>gcloud</code> command-line tool installed and authenticated on your local machine.</li>
                            <li>Node.js (LTS version recommended) and npm installed.</li>
                        </ul>

                        <h4>Step 1: GCP Project Setup &amp; Configuration</h4>
                        <p>First, we need a dedicated GCP project to house all our resources.</p>
                        <ol>
                            <li>Navigate to the <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" className="text-brand-primary hover:underline">GCP Console</a> and create a new project. Give it a descriptive name like "ProjectFlow Backend". Note the <strong>Project ID</strong>, as you'll need it for CLI commands.</li>
                            <li>Ensure a billing account is linked to your project. Serverless components still incur costs, so billing is required.</li>
                            <li>Enable the necessary APIs. Go to <strong>APIs &amp; Services &gt; Library</strong>. Search for and enable each of the following APIs:
                                <ul>
                                    <li><strong>Cloud Functions API:</strong> Allows you to create and manage serverless functions.</li>
                                    <li><strong>Cloud Build API:</strong> Used by Cloud Functions to build your code into a runnable container.</li>
                                    <li><strong>BigQuery API:</strong> Allows programmatic access to your BigQuery data.</li>
                                    <li><strong>Identity and Access Management (IAM) API:</strong> For managing permissions.</li>
                                </ul>
                            </li>
                        </ol>

                        <h4>Step 2: Create BigQuery Dataset and Tables</h4>
                        <p>BigQuery will be our database. A dataset is a container for our tables, which are structured with predefined schemas to ensure data consistency.</p>
                        <ol>
                            <li>In the GCP Console, navigate to <strong>BigQuery</strong>.</li>
                            <li>Find your project in the Explorer panel, click the three-dot menu, and select <strong>Create dataset</strong>.
                                <ul>
                                    <li>Enter a Dataset ID (e.g., <code>projectflow_data</code>).</li>
                                    <li>Choose a location (e.g., <code>US (multiple regions in United States)</code>) and click Create dataset.</li>
                                </ul>
                            </li>
                            <li>Create the required tables. For each table below, click the three-dot menu next to your new dataset, select <strong>Create table</strong>, and enter the table name.</li>
                            <li>In the table creation screen, toggle the "Edit as text" switch in the Schema section and paste the corresponding JSON schema.</li>
                        </ol>
                        
                        <p className="font-semibold">Table: <code>projects</code></p>
                        <pre className="bg-base-100 dark:bg-zinc-900 p-3 rounded-lg text-xs overflow-x-auto"><code>
{`[
  {"name": "projectId", "type": "STRING", "mode": "REQUIRED"},
  {"name": "projectName", "type": "STRING", "mode": "REQUIRED"},
  {"name": "projectLead", "type": "STRING", "mode": "NULLABLE"},
  {"name": "status", "type": "STRING", "mode": "NULLABLE"},
  {"name": "description", "type": "STRING", "mode": "NULLABLE"},
  {"name": "members", "type": "STRING", "mode": "REPEATED"}
]`}
                        </code></pre>
                        
                        <p className="font-semibold">Table: <code>tasks</code></p>
                        <pre className="bg-base-100 dark:bg-zinc-900 p-3 rounded-lg text-xs overflow-x-auto"><code>
{`[
  {"name": "taskId", "type": "STRING", "mode": "REQUIRED"},
  {"name": "taskName", "type": "STRING", "mode": "REQUIRED"},
  {"name": "project", "type": "STRING", "mode": "NULLABLE"},
  {"name": "assignee", "type": "STRING", "mode": "NULLABLE"},
  {"name": "status", "type": "STRING", "mode": "NULLABLE"},
  {"name": "subStatus", "type": "STRING", "mode": "NULLABLE"},
  {"name": "priority", "type": "STRING", "mode": "NULLABLE"},
  {"name": "startDate", "type": "DATE", "mode": "NULLABLE"},
  {"name": "dueDate", "type": "DATE", "mode": "NULLABLE"},
  {"name": "completionDate", "type": "TIMESTAMP", "mode": "NULLABLE"},
  {"name": "description", "type": "STRING", "mode": "NULLABLE"},
  {"name": "parentId", "type": "STRING", "mode": "NULLABLE"},
  {"name": "createdAt", "type": "TIMESTAMP", "mode": "NULLABLE"}
]`}
                        </code></pre>
                         <CostInfo title="BigQuery: Free Tier & Cost Projection">
                            <p><strong>Free Tier Allowances:</strong></p>
                            <ul className="list-disc list-inside">
                                <li><strong>10 GB of storage</strong> per month.</li>
                                <li><strong>1 TB of query processing</strong> per month.</li>
                            </ul>
                            <p><strong>What This Means for ProjectFlow:</strong></p>
                            <p>The free tier is extremely generous. 10 GB of storage can hold millions of tasks and comments. 1 TB of querying is more than enough for fetching data, even with a moderately sized team. You are unlikely to exceed the free tier for a considerable time.</p>
                            <p><strong>Cost Projection Beyond Free Tier:</strong></p>
                            <ul className="list-disc list-inside">
                                <li><strong>Storage:</strong> Around $0.02 per GB per month. Storing an additional 100 GB of data would cost about $2/month.</li>
                                <li><strong>Querying:</strong> Around $6 per TB. If you processed 2 TB of data in a month, the cost would be about $6.</li>
                            </ul>
                         </CostInfo>

                        <h4>Step 3: Develop Cloud Functions Backend</h4>
                        <p>We'll create a single Cloud Function that acts as a RESTful API using Express.js. This is more manageable than deploying a separate function for every endpoint.</p>
                        <ol>
                            <li><strong>Local Setup:</strong> On your machine, create a new project directory (e.g., <code>projectflow-backend</code>), navigate into it, and initialize a Node.js project: <code>npm init -y</code>.</li>
                            <li><strong>Install Dependencies:</strong>
                                <pre className="bg-base-100 dark:bg-zinc-900 p-3 my-2 rounded-lg text-xs overflow-x-auto"><code>{`npm install express cors @google-cloud/bigquery uuid`}</code></pre>
                                <ul>
                                    <li><code>express</code>: A web framework to handle routing.</li>
                                    <li><code>cors</code>: To handle Cross-Origin Resource Sharing.</li>
                                    <li><code>@google-cloud/bigquery</code>: The official Node.js client for BigQuery.</li>
                                    <li><code>uuid</code>: To generate unique IDs for new items.</li>
                                </ul>
                            </li>
                            <li><strong>Create API file (<code>index.js</code>):</strong> This file will contain all your API logic.</li>
                        </ol>
                        <pre className="bg-base-100 dark:bg-zinc-900 p-3 rounded-lg text-xs overflow-x-auto"><code>
{`// index.js
const express = require('express');
const cors = require('cors');
const { BigQuery } = require('@google-cloud/bigquery');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(cors({ origin: true }));
app.use(express.json()); // Middleware to parse JSON bodies

const bigquery = new BigQuery();
const datasetId = 'projectflow_data';

// --- READ Endpoints ---
app.get('/initialData', async (req, res) => {
  try {
    const [projects] = await bigquery.dataset(datasetId).table('projects').getRows();
    const [tasks] = await bigquery.dataset(datasetId).table('tasks').getRows();
    const [team] = await bigquery.dataset(datasetId).table('team_members').getRows();
    const [comments] = await bigquery.dataset(datasetId).table('comments').getRows();
    res.status(200).json({ projects, tasks, team, comments });
  } catch (error) {
    console.error('ERROR fetching initial data:', error);
    res.status(500).json({ error: 'Failed to fetch initial data.' });
  }
});

// --- WRITE Endpoints (Example) ---
app.post('/addNewTask', async (req, res) => {
  try {
    const taskData = req.body;
    // Basic validation
    if (!taskData.taskName || !taskData.project) {
      return res.status(400).json({ error: 'Missing required fields: taskName, project' });
    }

    const newTask = {
      taskId: \`TASK-\${uuidv4()}\`,
      createdAt: new Date().toISOString(),
      completionDate: null,
      ...taskData,
    };
    
    await bigquery.dataset(datasetId).table('tasks').insert(newTask);
    res.status(201).json(newTask);

  } catch (error) {
    console.error('ERROR adding new task:', error);
    res.status(500).json({ error: 'Failed to add new task.' });
  }
});

// Add other POST endpoints for projects, comments, etc. following the pattern above.

exports.api = app; // Export the express app
`}
                        </code></pre>
                        <li>Update your <code>package.json</code> to set the main entry point:
                        <pre className="bg-base-100 dark:bg-zinc-900 p-3 my-2 rounded-lg text-xs overflow-x-auto"><code>{`"main": "index.js"`}</code></pre>
                        </li>

                        <h4>Step 4: Deployment and Security</h4>
                        <ol>
                            <li><strong>Deploy the Function:</strong> From your <code>projectflow-backend</code> directory, run the deployment command.
                                <pre className="bg-base-100 dark:bg-zinc-900 p-3 my-2 rounded-lg text-xs overflow-x-auto"><code>{`gcloud functions deploy api --runtime nodejs18 --trigger-http --allow-unauthenticated --entry-point=api`}</code></pre>
                                <p>This command packages your code, uploads it, and exposes it via a public HTTP URL. Note the trigger URL provided after deployment.</p>
                            </li>
                            <li><strong>Security Best Practice (Production):</strong> The <code>--allow-unauthenticated</code> flag makes your API public. For a real application, you must secure it.
                                <ol>
                                    <li>Find your Apps Script project's service account. In the Apps Script editor, go to Project Settings, scroll to "Google Cloud Platform (GCP) Project", and copy the service account email.</li>
                                    <li>In your backend GCP project, go to <strong>IAM &amp; Admin</strong>, click <strong>Grant Access</strong>.</li>
                                    <li>Paste the service account email as the "New principal".</li>
                                    <li>Assign the role <strong>Cloud Functions Invoker</strong>. This allows only your Apps Script project to call the function.</li>
                                    <li>Re-deploy your function, but this time, <strong>remove</strong> the <code>--allow-unauthenticated</code> flag.</li>
                                </ol>
                            </li>
                        </ol>
                        <CostInfo title="Cloud Functions: Free Tier & Cost Projection">
                            <p><strong>Free Tier Allowances (per month):</strong></p>
                            <ul className="list-disc list-inside">
                                <li><strong>2 million invocations</strong> (API calls).</li>
                                <li><strong>400,000 GB-seconds</strong> of compute time.</li>
                                <li><strong>200,000 GHz-seconds</strong> of compute time.</li>
                            </ul>
                            <p><strong>What This Means for ProjectFlow:</strong></p>
                            <p>You can make 2 million API calls every month for free. For an internal tool with a small-to-medium team, it is highly probable that your usage will remain within the free tier indefinitely.</p>
                            <p><strong>Cost Projection Beyond Free Tier:</strong></p>
                            <ul className="list-disc list-inside">
                                <li><strong>Invocations:</strong> $0.40 per million calls. An extra 5 million calls would cost $2.00.</li>
                                <li><strong>Compute Time:</strong> Costs are negligible for this type of lightweight API. You would need billions of invocations for compute time to become a significant cost factor.</li>
                            </ul>
                        </CostInfo>

                        <h4>Step 5: Integrate with Apps Script Frontend</h4>
                        <p>Finally, update the server-side Apps Script file (<code>code.gs</code>) to act as a proxy, securely calling your new Cloud Function API.</p>
                        <pre className="bg-base-100 dark:bg-zinc-900 p-3 rounded-lg text-xs overflow-x-auto"><code>
{`// code.gs
const API_BASE_URL = 'YOUR_CLOUD_FUNCTION_TRIGGER_URL'; // e.g., https://us-central1-your-project.cloudfunctions.net/api

function getInitialData() {
  const url = API_BASE_URL + '/initialData';
  const options = {
    'method': 'get',
    'headers': {
      'Authorization': 'Bearer ' + ScriptApp.getOAuthToken()
    },
    'muteHttpExceptions': true
  };
  const response = UrlFetchApp.fetch(url, options);
  return JSON.parse(response.getContentText());
}

function addNewTask(taskData) {
  const url = API_BASE_URL + '/addNewTask';
  const options = {
    'method': 'post',
    'contentType': 'application/json',
    'headers': {
      'Authorization': 'Bearer ' + ScriptApp.getOAuthToken()
    },
    'payload': JSON.stringify(taskData),
    'muteHttpExceptions': true
  };
  const response = UrlFetchApp.fetch(url, options);
  return JSON.parse(response.getContentText());
}`}
                        </code></pre>
                    </div>
                </DocSection>
                
                <DocSection title="Architectural Recommendations">
                    <div className="text-base-content/90 space-y-6 text-sm prose prose-sm dark:prose-invert max-w-none">
                        <p>
                            The serverless backend described above provides a solid and scalable foundation.
                            As your application grows in complexity and user base, consider implementing the following architectural enhancements to improve real-time collaboration, security, and developer workflow.
                        </p>
                        
                        <div>
                            <h4>1. Real-time Collaboration with Firestore & BigQuery Sync</h4>
                            <p>
                                Transition from a request/response model to a real-time, event-driven architecture for a significantly more interactive user experience.
                            </p>
                            <p><strong>Why this is important:</strong></p>
                            <ul className="list-disc list-inside">
                                <li><strong>Instantaneous UI Updates:</strong> When one user moves a task, it updates on every other team member's screen instantly, without needing a page refresh. This is the gold standard for collaborative tools.</li>
                                <li><strong>Improved Performance:</strong> Firestore is optimized for low-latency reads and writes of individual documents, making it ideal for the high-frequency CRUD (Create, Read, Update, Delete) operations of a live application.</li>
                                <li><strong>Offline Support:</strong> The Firestore client SDKs have excellent built-in offline persistence. Users on unstable connections can continue working, and their changes will sync automatically when they reconnect.</li>
                                <li><strong>Separation of Concerns:</strong> This approach creates a clean separation between your <strong>operational database</strong> (Firestore, for live app data) and your <strong>analytical database</strong> (BigQuery, for reporting, AI summaries, and long-term storage).</li>
                            </ul>

                            <p><strong>When to implement it:</strong></p>
                            <p>
                                Implement this when real-time collaboration becomes a core feature requirement. While powerful, it represents a significant shift from the current architecture. It's an excellent "Version 2.0" upgrade after validating the core product.
                            </p>

                            <p><strong>How to implement it:</strong></p>
                            <ol>
                                <li><strong>Set up Firestore:</strong> In your GCP project, enable Firestore in Native Mode. Create collections that mirror your data model (e.g., <code>projects</code>, <code>tasks</code>).</li>
                                <li><strong>Modify the Frontend:</strong> Instead of calling your API for data, use the Firebase Web SDK to interact directly and securely with Firestore. Use methods like <code>onSnapshot</code> to listen for real-time changes to collections and documents.</li>
                                <li><strong>Create a Sync Function:</strong> Develop a new Cloud Function that is triggered by changes in Firestore. This function will be responsible for writing the data to BigQuery.</li>
                            </ol>
                            <pre className="bg-base-100 dark:bg-zinc-900 p-3 my-2 rounded-lg text-xs overflow-x-auto"><code>
{`// Example Firestore-to-BigQuery Sync Function (functions/index.js)
const functions = require('@google-cloud/functions-framework');
const { BigQuery } = require('@google-cloud/bigquery');
const bigquery = new BigQuery();

// Trigger this function whenever a document in the 'tasks' collection is written
exports.syncTaskToBigQuery = functions.firestore.onDocumentWritten('tasks/{taskId}', (event) => {
  console.log(\`Task changed: \${event.params.taskId}\`);
  
  const taskData = event.data.after.data(); // Get the new data
  
  // You may need to transform the data to match your BigQuery schema
  const bqRow = {
    taskId: event.params.taskId,
    taskName: taskData.name,
    // ...map other fields
    // Ensure all dates/timestamps are in the correct format for BigQuery
  };

  return bigquery
    .dataset('projectflow_data')
    .table('tasks')
    .insert(bqRow)
    .then(() => console.log('Successfully synced task to BigQuery.'))
    .catch(err => console.error('ERROR syncing to BigQuery:', err));
});
`}
                            </code></pre>
                            <CostInfo title="Firestore: Free Tier & Cost Projection">
                                <p><strong>Free Tier Allowances (per month):</strong></p>
                                <ul className="list-disc list-inside">
                                    <li><strong>1 GiB of storage</strong>.</li>
                                    <li><strong>50,000 document reads</strong> per day.</li>
                                    <li><strong>20,000 document writes</strong> per day.</li>
                                    <li><strong>20,000 document deletes</strong> per day.</li>
                                </ul>
                                <p><strong>What This Means for ProjectFlow:</strong></p>
                                <p>The free tier is excellent for development and small-team usage. 50,000 reads per day can support a very active team. You will likely stay within the free tier for reads and writes during early stages.</p>
                                <p><strong>Cost Projection Beyond Free Tier:</strong></p>
                                <ul className="list-disc list-inside">
                                    <li><strong>Storage:</strong> ~$0.18 per GiB per month.</li>
                                    <li><strong>Reads/Writes/Deletes:</strong> ~$0.054 per 100,000 reads, ~$0.18 per 100,000 writes. An extra 1 million reads and 200,000 writes would cost about $0.90 per month.</li>
                                </ul>
                             </CostInfo>
                        </div>
                        
                        <div>
                            <h4>2. Centralized API Management with API Gateway</h4>
                            <p>Introduce API Gateway as a professional, secure entry point for all backend services, moving beyond the raw Cloud Function URL.</p>
                            
                            <p><strong>Why this is important:</strong></p>
                            <ul className="list-disc list-inside">
                                <li><strong>Stable URL & Custom Domain:</strong> Provides a permanent, branded URL (e.g., <code>api.yourdomain.com</code>) for your frontend to call. You can update or replace the underlying Cloud Function without ever changing the public-facing URL.</li>
                                <li><strong>Enhanced Security:</strong> API Gateway can handle authentication (e.g., using API keys or JWTs) and can be configured to reject malformed requests before they ever reach your function's code.</li>
                                <li><strong>Performance & Cost Control:</strong> You can configure caching for frequently accessed, non-sensitive GET endpoints and set up rate limiting to prevent abuse and manage costs.</li>
                                <li><strong>Centralized Monitoring:</strong> Offers unified logging, monitoring, and tracing for all your API traffic in one place.</li>
                            </ul>
                            
                            <p><strong>When to implement it:</strong></p>
                            <p>
                                This is a good step to take before a public launch or when you plan to expose your API to third-party services. It adds a layer of professionalism and control that is crucial for production systems.
                            </p>
                            
                            <p><strong>How to implement it:</strong></p>
                            <ol>
                                <li><strong>Define an OpenAPI Spec:</strong> Create an <code>openapi.yaml</code> file that formally defines your API's paths, methods, and parameters. This spec will tell the gateway how to route requests to your Cloud Function.</li>
                                <li><strong>Create the Gateway:</strong> In the GCP Console, navigate to API Gateway, create a new API, and then create a gateway instance.</li>
                                <li><strong>Upload an API Config:</strong> Upload your <code>openapi.yaml</code> file as a new API config, specifying your Cloud Function's URL as the backend address.</li>
                                <li><strong>Update Frontend:</strong> Point your frontend's API calls to the new URL provided by the deployed gateway.</li>
                            </ol>
                            <pre className="bg-base-100 dark:bg-zinc-900 p-3 my-2 rounded-lg text-xs overflow-x-auto"><code>
{`# openapi.yaml
swagger: '2.0'
info:
  title: ProjectFlow API
  version: 1.0.0
schemes:
  - https
produces:
  - application/json
paths:
  /initialData:
    get:
      summary: Get all initial project data
      operationId: getInitialData
      x-google-backend:
        address: YOUR_CLOUD_FUNCTION_TRIGGER_URL/initialData
      responses:
        '200':
          description: A successful response
          schema:
            type: object`}
                            </code></pre>
                            <CostInfo title="API Gateway: Free Tier & Cost Projection">
                                <p><strong>Free Tier Allowances (per month):</strong></p>
                                <ul className="list-disc list-inside">
                                    <li><strong>2 million calls</strong> per month.</li>
                                </ul>
                                <p><strong>What This Means for ProjectFlow:</strong></p>
                                <p>This aligns perfectly with the Cloud Functions free tier. You can make 2 million gateway requests per month at no cost.</p>
                                <p><strong>Cost Projection Beyond Free Tier:</strong></p>
                                <ul className="list-disc list-inside">
                                    <li><strong>Calls:</strong> Pricing is tiered, starting at around $2.00 per million calls after the free tier. An extra 5 million calls would cost about $10.00.</li>
                                </ul>
                             </CostInfo>
                        </div>

                        <div>
                             <h4>3. Proactive Data Integrity with Server-Side Validation</h4>
                             <p>Never trust client-side data. Implement strict, schema-based validation within your Cloud Function to ensure data is clean, safe, and correctly formatted before it ever touches your database.</p>
                             <p><strong>Why this is important:</strong></p>
                             <ul className="list-disc list-inside">
                                 <li><strong>Prevents Corrupt Data:</strong> Protects your database from malformed or incomplete entries, which can cause bugs that are very difficult to trace.</li>
                                 <li><strong>Improves Security:</strong> Guards against common injection attacks and ensures that data types are correct (e.g., a string is not treated as a number).</li>
                                 <li><strong>Clear Error Messaging:</strong> Provides immediate, specific feedback to the client (or developer) about what was wrong with a request, speeding up debugging.</li>
                                 <li><strong>Self-Documenting Code:</strong> Zod schemas act as clear, machine-readable documentation for the expected shape of your API's data.</li>
                             </ul>
                             <p><strong>When to implement it:</strong></p>
                             <p>
                                 Immediately. This should be a non-negotiable part of your initial backend development process. It's much harder to clean up a corrupted database than to prevent bad data from entering in the first place.
                             </p>
                             <p><strong>How to implement it:</strong></p>
                            <p>Use a library like Zod in your Express routes to parse and validate the incoming request body against a predefined schema. If validation fails, Zod throws a detailed error that you can catch and return as a 400 Bad Request response.</p>
                             <pre className="bg-base-100 dark:bg-zinc-900 p-3 my-2 rounded-lg text-xs overflow-x-auto"><code>
{`const { z } = require('zod');

// Define a schema for creating a task. Be specific!
const CreateTaskSchema = z.object({
  taskName: z.string().min(1, { message: "Task name cannot be empty." }),
  project: z.string().min(1),
  assignee: z.string(),
  priority: z.enum(['Low', 'Medium', 'High', 'Urgent']),
  description: z.string().optional(), // .optional() allows it to be missing
  dueDate: z.string().date().nullable(), // Accepts YYYY-MM-DD format string
});

// Inside your Express route:
app.post('/addNewTask', async (req, res) => {
  try {
    // This line will throw an error if the body doesn't match the schema
    const validatedData = CreateTaskSchema.parse(req.body);

    const newTask = {
      taskId: \`TASK-\${uuidv4()}\`,
      createdAt: new Date().toISOString(),
      ...validatedData
    };

    await bigquery.dataset(datasetId).table('tasks').insert(newTask);
    res.status(201).json(newTask);

  } catch (error) {
    if (error instanceof z.ZodError) {
      // Return a detailed validation error message
      return res.status(400).json({ error: 'Invalid input.', details: error.errors });
    }
    console.error('ERROR adding new task:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});`}
                             </code></pre>
                        </div>

                        <div>
                            <h4>4. Automated & Reliable Deployments with CI/CD</h4>
                            <p>Automate your testing and deployment process by connecting your source code repository (e.g., GitHub) to a Continuous Integration/Continuous Deployment service like Cloud Build.</p>
                             <p><strong>Why this is important:</strong></p>
                             <ul className="list-disc list-inside">
                                 <li><strong>Reduces Human Error:</strong> Manual deployments are prone to mistakes. Automation ensures the same deployment process is followed every single time.</li>
                                 <li><strong>Increases Development Velocity:</strong> Developers can merge code with confidence, knowing that it will be automatically tested and deployed if it passes, allowing for faster iteration.</li>
                                 <li><strong>Enforces Quality Gates:</strong> You can configure your pipeline to run automated tests (unit, integration) and block a deployment if any tests fail, preventing bugs from reaching production.</li>
                                 <li><strong>Deployment History:</strong> Provides a clear, auditable log of all deployments, making it easy to see what was deployed and when, and to roll back to a previous version if necessary.</li>
                             </ul>
                             <p><strong>When to implement it:</strong></p>
                             <p>
                                 As soon as your backend code lives in a Git repository and you have more than one developer working on it, or when you begin making frequent changes. It's a foundational DevOps practice.
                             </p>
                             <p><strong>How to implement it:</strong></p>
                             <ol>
                                 <li><strong>Commit Code to Git:</strong> Push your <code>projectflow-backend</code> directory to a repository on GitHub, GitLab, or Cloud Source Repositories.</li>
                                 <li><strong>Create <code>cloudbuild.yaml</code>:</strong> Add a build configuration file to the root of your repository. This file tells Cloud Build what to do.</li>
                                 <li><strong>Set up a Cloud Build Trigger:</strong> In the GCP Console, go to Cloud Build and create a trigger that watches your repository. Configure it to start a build on every push to your <code>main</code> branch. Point the trigger to your <code>cloudbuild.yaml</code> file.</li>
                             </ol>
                            <pre className="bg-base-100 dark:bg-zinc-900 p-3 my-2 rounded-lg text-xs overflow-x-auto"><code>
{`# cloudbuild.yaml
steps:
# First, install npm dependencies
- name: 'gcr.io/cloud-builders/npm'
  args: ['install']

# (Optional but recommended) Run tests
# - name: 'gcr.io/cloud-builders/npm'
#   args: ['test']

# Finally, deploy the Cloud Function
- name: 'gcr.io/cloud-builders/gcloud'
  args:
    - 'functions'
    - 'deploy'
    - 'api' # Your function name
    - '--source=.'
    - '--trigger-http'
    - '--runtime=nodejs18'
    - '--entry-point=api'
    - '--region=us-central1' # Specify your region
    # Omit --allow-unauthenticated for a secure, production deployment
`}
                            </code></pre>
                             <CostInfo title="Cloud Build: Free Tier & Cost Projection">
                                <p><strong>Free Tier Allowances:</strong></p>
                                <ul className="list-disc list-inside">
                                    <li><strong>120 build-minutes</strong> per day.</li>
                                </ul>
                                <p><strong>What This Means for ProjectFlow:</strong></p>
                                <p>A typical Cloud Function deployment takes 1-2 minutes. The free tier allows for over 60 deployments per day, which is more than sufficient for any development team. It is extremely unlikely you will ever pay for Cloud Build with this architecture.</p>
                                <p><strong>Cost Projection Beyond Free Tier:</strong></p>
                                <ul className="list-disc list-inside">
                                    <li><strong>Build-minutes:</strong> ~$0.003 per minute. An extra 1,000 build-minutes in a month would cost about $3.00.</li>
                                </ul>
                             </CostInfo>
                        </div>
                    </div>
                </DocSection>
            </div>
        </div>
    );
};
