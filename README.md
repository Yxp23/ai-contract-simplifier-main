🧾 AI Contract & Document Simplifier

A full-stack AI tool that converts long, complex legal contracts into clear, structured, plain-English summaries with risks, obligations, payments, and next steps — powered by GPT-4o.

🚀 Overview

This project is a Next.js + OpenAI application that ingests full-length contracts (PDF or raw text), extracts clauses, analyzes legal risk, and produces a structured JSON summary with optional “brief” or “simple English” tone.

It is built as a production-grade AI app, featuring chunking, multi-stage LLM reasoning, PDF parsing, and a polished front-end.

✨ Key Features & Technical Highlights
🔹 Advanced AI Processing Pipeline (LLM System Design)
The system is engineered for reliability on long, complex documents:

Document Chunking: Automatically splits large documents (up to 350,000 characters) into safe, manageable segments to adhere to LLM context window limits and optimize processing.

Two-Phase Reasoning: Utilizes a custom, two-pass pipeline for legal accuracy:

Phase 1 (Hidden): Clause Extraction: Identifies and extracts specific legal clauses (Obligations, Liabilities, Penalties, etc.) from each chunk.

Phase 2 (Final): Structured Summary: Merges all extracted data and runs a final GPT-4o call to generate the complete, normalized JSON output.

🔹 Real-World Legal Understanding
The application detects and summarizes critical real-world contractual elements:

Risk Flags: Identifies high-risk language related to Indemnity, Liability, and Damages.

Key Clauses: Extracts specific terms for Termination (e.g., 7-day/30-day rules), Insurance minimums (e.g., USD 1,000,000 coverage), and SHE penalties (e.g., up to USD 50,000/year).

Obligation Mapping: Clearly separates "Your" obligations from "Their" obligations.

🔹 Structured Output & UI
JSON Schema: Ensures the AI returns consistent, machine-readable data via a predefined structured schema (see below), facilitating reliable front-end parsing.

Intelligent PDF Processing: Uses PDF.js for robust, multi-page text extraction from uploaded PDF files.

Tone Control: Allows users to toggle between "Brief" (Executive Summary) and "Simple" (7th-grade English) summary tones.

🧠 Technology Stack Summary
The AI Contract Simplifier is built as a modern, full-stack application leveraging advanced AI models and cloud infrastructure for high performance and scalability.

Core Technologies
The project utilizes a robust stack focused on modern JavaScript and AI/ML capabilities:

Frontend/Full-Stack: The primary framework is Next.js 14, utilizing the App Router architecture. The core language is TypeScript, built on React.js components, with styling handled by Tailwind CSS.

AI/NLP: The system is powered by OpenAI GPT-4o. Key implementation skills include Multi-step prompt engineering, sophisticated LLM Chunking for handling large inputs, and strict JSON Mode for reliable, structured output.

Backend/Infrastructure: The application is deployed and hosted using Vercel, leveraging the Edge Runtime for extremely fast API execution. It employs Vercel CI/CD for continuous deployment and manages sensitive data using Environment Variable Management.

Utilities: PDF.js is specifically integrated for robust text extraction from PDF documents.

📈 Future Enhancements
Red-flag heatmap and risk scoring (0–100) for each section.

Clause-by-clause comparison against the original contract.

User authentication and saved summary history.
