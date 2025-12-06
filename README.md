# Fesgheli Animation Writer

A smart scenario writer for the Fesgheli animation series using Gemini AI.

## Features
- **Scenario Generation**: Generates full episode scripts with Persian storytelling and English technical prompts.
- **Character Management**: Supports specific characters (Baby, Ava, Hapo).
- **Image Generation**: Uses Gemini 2.5 Flash Image to generate storyboard visuals.
- **Video Generation**: Uses Veo to animate shots.
- **Export**: Export to Word or share via social media.

## How to Use
1.  Enter the main topic for the animation episode in the input box.
2.  (Optional) Add any specific details or keywords you want to be included.
3.  Use the sidebar to configure the number of sequences, videos, and default characters.
4.  (Optional) Upload reference images for characters for more accurate visuals.
5.  Click "تولید سناریو" (Generate Scenario).
6.  Once the script is generated, you can modify characters/video counts for each sequence and click "به روز رسانی" (Update) to regenerate prompts.
7.  Generate images and videos for each shot as needed.

## Tech Stack
- React 19
- TypeScript
- Google GenAI SDK (@google/genai)
- Tailwind CSS