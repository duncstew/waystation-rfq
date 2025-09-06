# Core Problem
The core problem is converting unstructured email text into structured, usable data for analysis and decision-making (at scale).

# My Limited Business Context Knowledge of Waystation
In the short term, waystation will focus on core data extraction and automated responses to augment the procurement manager, while the long-term vision includes analytics, a framework for continuous improvement, and full automation of this procurement workflow with minimal human intervention i.e auto drafting + sending of emails to suppliers, choosing suppliers based on a robustly populated comparison table + i'm sure there is more.

# Short Term Architecture + Features + Design Decisions (Regarding Waystation)
## Proposed Architecture:
A decoupled, event-driven architecture designed to handle spiky, asynchronous workloads.

## Email Ingestion and Queuing:
Incoming supplier emails are received and immediately placed in a message queue. This acts as a buffer, ensuring that no email is lost during high volume periods and decouples the ingestion process from the processing logic.

## Asynchronous Workers
A set of "worker" services pulls emails from the queue for processing. Each worker is responsible for invoking the LLM to perform data extraction. If an email fails to parse, an alert is sent to a human operator for review.

## Clarification on the Role of LLMs: Chaining vs. Agentic Approaches
System's core intelligence / features rely on LLMs, and there are a few ways to implement this that come to mind.

For the initial, short-term goals, a chained deterministic approach is probably the most effective. This would involve a series of sequential, pre-defined LLM calls where the output of one call serves as the input for the next. The logic would follow a clear, predictable path (these bullet points are not comprehensive as I'd need to learn more about the features of waystation)
    1. Classification: LLM classifies the incoming email (e.g. "requires extraction", "spam", "etc")
    2. Data Extraction: If classified as "requires extraction," the LLM extracts key data points and outputs them in a structured format (JSON)
    3. Validation and Decision Making: Use the structured data to update the database record and check if all buyer requirements were met. Also assess the confidence level of the extraction.
    4. Response Generation: Based on the vlaidation, the system uses LLMs to draft context-aware response emails (e.g. "Thank you for the complete bid" or "We are missing pricing information, please provid x,y,z, etc" )

Personally I think the chained approach is well-suited for the short term because the workflow is relatively straightforward (I think?) with limited, well-defined branches in logic. Maybe as the system matures and there are way more application features (and therefore potential tools for an agent to use) you might require an agent. An agent in this case could be useful as it could break down a high-level goal, create sub problems, and choose from teh set of application features (tools) to achieve the objective. This would be way more complex to build out but would be powerful (imo) for handling hihgly non-deterministic senarios tha require dynamic, multi-step actions. But for now the chaine approach prvides the best balance of simplicity, reliability and effectivness for the core business problem.

## User Interface:
Provide procurement manager with dashboard to initate requests, monitor ongoing bids, view comparison table, and interact with data. Key Feature: UI enables procurement managers to click on any data point in comparison table and see its exact source in the original email, fulfilling the transparency requirement.

## LLM Cost vs Accuracy

Tradeoff: Using more powerful LLMs provides the highest accuracy for data extraction but comes with higher costs. Using smaller, more cost-effective models would reduce expenses but might increase parsing errors and require more human intervention.

Decision: The initial approach favors using more accurate models. While more expensive, this builds user trust in the system's ability to provide a robust and reliable database of record. A strong validation and testing framework will be crucial for managing this trade-off over time.
    Side note: Creating a validation and testing framework would be **extremely important** to solving the accuracy/cost/value problem above. 


# Architectural Overview & Scalability Notes (For Demo App)
Due to time constraints, this application uses a decoupled, synchronous architecutre for faster development and clarity. Frontend and backend are separate services.

## Key Architectural Components
1. Frontend (React + TypeScript): A single-page application (SPA) built with React and TypeScript. Tailwind CSS was chosen bc it enables fast UI development without complex custom styling.
2. Backend (Python + FastAPI): A RESTful API built with FastAPI.
3. Database (PostgreSQL): A robust relational database for storing structured data like suppliers, RFQs, and quotes. The use of Alembic provides a version-controlled database migration system, making schema changes reliable.
4. LLM Integration (Google Gemini API): The core intelligence is a modular service that communicates with the Google Gemini API. This is decoupled from the main API logic, making it easy to swap out different LLMs or add new ones without changing core business logic.

## Scalability Considerations
1. Decoupled Services: The frontend and backend can be hosted on separate servers and scaled horizontally based on traffic.
2. Asynchronous Backend: FastAPI’s asynchronous nature allows the backend to handle a large number of concurrent requests, particularly for I/O-bound tasks like database queries and LLM API calls.
3. Improvements if I could: For true production readiness, the current synchronous LLM processing would be replaced with an event-driven architecture. Submitting an email would trigger an event, queuing the LLM job for asynchronous processing. This would prevent API endpoints from timing out and improve user experience by providing immediate feedback while the LLM calls work in the background.