# 🎓 AI-Powered Video Synopsis & Intelligent Learning Platform

> **An AI-driven learning platform that transforms lengthy educational videos into concise study material, interactive quizzes, AI-assisted tutoring, and presentation-ready notes using Large Language Models (LLMs), Retrieval-Augmented Generation (RAG), and modern full-stack technologies.**

---

## 📌 Overview

The rapid growth of online educational content has made it challenging for students and professionals to efficiently consume long-form video lectures. Hours of content often contain valuable insights but require significant time to watch and revise.

This project addresses that challenge by building an **AI-Powered Video Synopsis & Intelligent Learning Platform** that automatically converts educational videos into structured learning resources. The system extracts transcripts, generates intelligent summaries, creates PowerPoint presentations, prepares assessment quizzes, and enables users to interact with an AI-powered Study Coach capable of answering questions directly from video content.

The platform integrates **Large Language Models (LLMs)**, **Retrieval-Augmented Generation (RAG)**, **Speech-to-Text**, and **Full-Stack Web Development** to deliver a modern AI-assisted learning experience.

---

# 🚀 Key Features

### 🎥 Smart Video Processing

* Extracts transcripts from YouTube videos automatically.
* Uses Whisper as a fallback for videos without transcripts.
* Supports long-duration educational content.

### 📝 AI Video Summarization

* Generates chapter-wise summaries.
* Produces concise study notes.
* Highlights important concepts automatically.

### 📊 Automatic PowerPoint Generation

* Converts summarized content into presentation slides.
* Creates professional PPTs automatically.
* Saves hours of manual work.

### 🤖 AI Study Coach (RAG)

* Retrieval-Augmented Generation based chatbot.
* Answers questions using only the uploaded video's content.
* Provides context-aware responses with improved accuracy.

### 🧠 Intelligent Quiz Generator

* Automatically creates MCQs from summarized content.
* Helps learners evaluate their understanding.
* Generates topic-specific assessments.

### 👤 Secure Authentication System

* User Registration & Login
* JWT Authentication
* Password Recovery
* Protected Routes
* Role-based Admin Access

### 📚 Learning Dashboard

* View synopsis history
* Download generated resources
* Track generated content
* Manage previous learning sessions

---

# 🏗️ System Architecture

```
YouTube Video
        │
        ▼
Transcript Extraction
(YouTube Transcript API / Whisper)
        │
        ▼
Text Preprocessing
        │
        ▼
LLM Summarization
(OpenAI / Groq)
        │
 ┌───────────────┬──────────────┬─────────────┐
 ▼               ▼              ▼
Study Notes   PowerPoint     Quiz Generator
        │
        ▼
Vector Database
        │
        ▼
RAG-based AI Study Coach
        │
        ▼
React Frontend
```

---

# 🛠️ Technology Stack

## Frontend

* React.js
* TypeScript
* Vite
* HTML5
* CSS3

## Backend

* FastAPI
* Python
* REST APIs

## Artificial Intelligence

* OpenAI API
* Groq API
* Retrieval-Augmented Generation (RAG)
* Prompt Engineering

## Speech Processing

* Whisper
* YouTube Transcript API
* yt-dlp

## Database

* MongoDB Atlas

## Document Generation

* python-pptx

## Authentication

* JWT Authentication
* Password Hashing
* Secure User Management

## Version Control

* Git
* GitHub

---

# 💡 Project Workflow

1. User submits a YouTube video URL.
2. Transcript is extracted automatically.
3. AI preprocesses the transcript.
4. LLM generates an intelligent summary.
5. Study notes are created.
6. PowerPoint slides are generated.
7. Quiz questions are created automatically.
8. Content is indexed for Retrieval-Augmented Generation.
9. AI Study Coach answers user questions.
10. Generated resources are stored for future access.

---

# 🎯 Major Contributions

* Developed an end-to-end AI-powered educational platform from scratch.
* Designed a scalable full-stack architecture using React and FastAPI.
* Integrated multiple AI services including OpenAI, Groq, Whisper, and RAG.
* Automated transcript extraction, summarization, quiz generation, and presentation creation.
* Built secure authentication and role-based access control.
* Optimized backend APIs for efficient processing of long educational videos.
* Implemented modular and maintainable code architecture following industry best practices.

---

# 📈 Skills Demonstrated

* Artificial Intelligence
* Generative AI
* Large Language Models (LLMs)
* Retrieval-Augmented Generation (RAG)
* Prompt Engineering
* NLP
* REST API Development
* Full Stack Development
* React.js
* FastAPI
* MongoDB
* Authentication & Authorization
* Software Architecture
* Git & GitHub

---

# 🌍 Real-World Applications

* EdTech Platforms
* AI Learning Assistants
* Online Course Providers
* Corporate Training
* Skill Development Platforms
* University Learning Systems
* Knowledge Management Systems

---

# 💼 Internship Project

This project was developed as part of my internship at **Symbiosys Technologies**, where I worked on integrating Generative AI with modern web technologies to build scalable educational solutions. The internship strengthened my expertise in **AI application development**, **LLM integration**, **RAG pipelines**, **backend API design**, and **full-stack software engineering** while collaborating on real-world product development.

---

# 👩‍💻 Author

## **Madhupada Sravanthi Suma**

**B.Tech – Artificial Intelligence**

### Areas of Interest

* Artificial Intelligence
* Machine Learning
* Generative AI
* Large Language Models
* NLP
* Computer Vision
* Full Stack Development

---

## ⭐ If you found this project interesting, consider giving it a Star!
