

# AI Homework Solver for Indian Students

A clean, mobile-friendly app where students (Class 9 to College) can type or upload a photo of their question and get a detailed, step-by-step solution powered by AI.

## Pages & Layout

### Home Page — Question Input
- Clean, welcoming interface with the app title "SolveIt" or similar
- Subject selector chips: Math, Physics, Chemistry, Coding, Other
- Class/level selector: Class 9, 10, 11, 12, College
- Text area to type or paste a question
- Image upload button (camera icon) to upload a photo of a question
- "Solve" button to submit

### Solution Display
- Shows the AI-generated solution with:
  - Rewritten question at the top
  - Subject & topic identified
  - Step-by-step solution with formatted math (using markdown)
  - Formulas highlighted in boxes
  - Final answer clearly highlighted in a colored card
- Streaming response so students see the answer appearing in real-time
- "Ask Another" button to go back

## Key Features
1. **Image Upload**: Students upload a photo → sent to Gemini vision model for analysis
2. **AI-Powered Solutions**: Uses Lovable AI (Gemini) with the detailed teacher prompt to generate structured, step-by-step solutions
3. **Markdown Rendering**: Properly formatted math, code blocks, and structured content
4. **Mobile-First Design**: Optimized for phone screens since most Indian students use mobile
5. **History**: Recent questions saved locally so students can revisit solutions

## Backend
- **Edge Function** (`solve-question`): Receives text/image, sends to Gemini with the teacher system prompt, streams back the response
- Uses **Lovable Cloud** for the edge function and AI gateway
- No authentication needed — open access

## Design
- Light, clean theme with a gradient accent (blue/purple)
- Large, readable fonts for mobile
- Card-based layout for solutions

