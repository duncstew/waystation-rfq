## Assumptions

### Demo
1. Small-Scale Data. The solution assumes the volume of emails and RFQ data is small enough to be handled by a single, synchronous processing flow without overwhelming the server.
2. Synchronous Processing. The LLM calls and database updates are executed sequentially within the API request. This assumes that these operations will complete quickly enough to prevent user-facing timeouts. A production-ready system would use an asynchronous, event-driven approach.
3. Supplier Identification. The system assumes a supplier can be uniquely identified by their email address. If an email is submitted from an address not yet in the database, a new supplier is created.
4. One-to-One Quote-to-RFQ. The business logic assumes each supplier will submit exactly one quote per RFQ. This is explicitly stated in the prompt, and the database schema's unique constraint (_supplier_rfq_uc) enforces this.
Plain Text Emails. The application is built to process only plain text email content, ignoring any potential HTML formatting or attachments.
5. Security & Scalability Trade-off: The demo application prioritizes a simple, synchronous architecture for clarity. We assume that in a production environment, this would be replaced by a secure, asynchronous, event-driven system to handle scale and protect sensitive customer data through measures like data isolation and infrastructure hardening.

### Waystation
Waystation General Assumptions
1. Workflow Assumptions
    1. Users want to automate the tedious, manual process of data entry from quote emails, and that an LLM (OCR api), etc is a technically feasible and reliable way to accomplish this.
2. Cost-Effectiveness
	1. The cost of using an LLM API for every email is low enough to be profitable or sustainable within the products pricing model.
3. Feasibility Assumptions
	1. One of the more critical assumptions is that the progress and current state of LLMs is capable of consistently and accurately extracting structured data from a variety of email formats. It is probably a certainty that there are extremely varied email formats from different suppliers. Aka going to assumed that the emails and structure of emails or whatever communication is not standardized.
5. Supplier Workflow Inflexible. CPG suppliers don't want to onboard to procurement platforms -> Marketplace not a fit
6. Network Effects will create defensible product -> I have a q regarding this.
