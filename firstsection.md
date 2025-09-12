# First Section Image and Text Rotation System

## Overview
The first section implements a synchronized image and placeholder text rotation system that showcases different transformation examples while always returning to the main picture.

## Current Implementation

### Rotation Pattern
The system follows an alternating pattern where the main black and white picture appears between each transformation example:

1. **Main picture** → "Enter your roast or transformation prompt here..."
2. **Magical effect transformation** → "Add a magical effect around them ✨"
3. **Main picture** → "Enter your roast or transformation prompt here..."
4. **Robot transformation** → "Turn them into a robot 🤖"
5. **Main picture** → "Enter your roast or transformation prompt here..."
6. **Superhero transformation** → "Turn them into a superhero 🦸"
7. **Main picture** → "Enter your roast or transformation prompt here..."
8. **Movie poster transformation** → "Put them in a movie poster 🎬"
9. **Main picture** → "Enter your roast or transformation prompt here..."
10. **Outer space transformation** → "Put them in outer space 🚀"
11. **Main picture** → "Enter your roast or transformation prompt here..."
12. **Historical figure transformation** → "Make them a historical figure 👑"
13. **Main picture** → "Enter your roast or transformation prompt here..."
14. **Giant scene transformation** → "Make them giant in a scene 🔍"
15. **Main picture** → "Enter your roast or transformation prompt here..."
16. **Tiny scene transformation** → "Make them tiny in a scene 🔍"
17. **Main picture** → "Enter your roast or transformation prompt here..."
18. **Cartoon character transformation** → "Turn them into a cartoon character 📺"
19. **Back to step 1** (cycle repeats)

### Technical Details

#### Image Array
```javascript
const images = [
    'attached_assets/main pic web_1757164517069.jpeg',           // Main
    'attached_assets/add magical effect arond them_1757164700641.jpeg', // Magical
    'attached_assets/main pic web_1757164517069.jpeg',           // Main again
    'attached_assets/turn them into a robot_1757165048261.jpeg', // Robot
    'attached_assets/main pic web_1757164517069.jpeg',           // Main again
    'attached_assets/turn them into. superhero_1757165647938.jpeg', // Superhero
    'attached_assets/main pic web_1757164517069.jpeg',           // Main again
    'attached_assets/movie poster_1757211831807.jpeg',          // Movie poster
    'attached_assets/main pic web_1757164517069.jpeg',           // Main again
    'attached_assets/outer space_1757213156762.jpeg'            // Outer space
];
```

#### Synchronized Prompts
```javascript
const synchronizedPrompts = [
    "Enter your roast or transformation prompt here...", // Main image
    "Add a magical effect around them ✨",               // Magical effect image
    "Enter your roast or transformation prompt here...", // Main image again
    "Turn them into a robot 🤖",                        // Robot image
    "Enter your roast or transformation prompt here...", // Main image again
    "Turn them into a superhero 🦸",                     // Superhero image
    "Enter your roast or transformation prompt here...", // Main image again
    "Put them in a movie poster 🎬",                     // Movie poster image
    "Enter your roast or transformation prompt here...", // Main image again
    "Put them in outer space 🚀"                       // Outer space image
];
```

#### Timing
- **Rotation Interval**: 3 seconds per image/prompt
- **Fade Transition**: 0.3 seconds opacity transition between images
- **Synchronization**: Both image and text change simultaneously

### Features
- **Perfect Synchronization**: Images and placeholder text rotate together
- **Smooth Transitions**: Fade in/out effect for image changes
- **Smart Behavior**: Rotation stops when user starts typing, resumes when input is cleared
- **Consistent Pattern**: Always returns to main picture after each transformation example
- **Extensible**: Easy to add new transformations following the same pattern

### Adding New Transformations
To add a new transformation:
1. Add the main picture again to the images array
2. Add the new transformation image to the images array
3. Add "Enter your roast or transformation prompt here..." to the prompts array
4. Add the specific transformation prompt to the prompts array

### Current Assets
- **Main Picture**: `main pic web_1757164517069.jpeg` (black and white baseline)
- **Magical Effect**: `add magical effect arond them_1757164700641.jpeg`
- **Robot Transformation**: `turn them into a robot_1757165048261.jpeg`
- **Superhero Transformation**: `turn them into. superhero_1757165647938.jpeg`
- **Movie Poster Transformation**: `movie poster_1757211831807.jpeg`
- **Outer Space Transformation**: `outer space_1757213156762.jpeg`
- **Historical Figure Transformation**: `historical figure_1757270390879.jpeg`
- **Giant Scene Transformation**: `Giant_1757271069633.jpeg`
- **Tiny Scene Transformation**: `Tiny_1757271458272.jpeg`
- **Cartoon Character Transformation**: `cartoon_1757271945448.jpeg`

## Purpose
This system demonstrates various transformation possibilities to users while maintaining a consistent baseline (main picture) that helps users understand the before/after concept. The synchronized text prompts guide users on what each transformation represents.