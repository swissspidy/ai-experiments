# WordPress AI Experiments

[![Commit activity](https://img.shields.io/github/commit-activity/m/swissspidy/ai-experiments)](https://github.com/swissspidy/ai-experiments/pulse/monthly)
[![Code Coverage](https://codecov.io/gh/swissspidy/ai-experiments/branch/main/graph/badge.svg)](https://codecov.io/gh/swissspidy/ai-experiments)
[![License](https://img.shields.io/github/license/swissspidy/ai-experiments)](https://github.com/swissspidy/ai-experiments/blob/main/LICENSE)

Client-side AI experiments using Chrome's [built-in AI](https://developer.chrome.com/docs/ai/built-in) and other solutions.

**Note:** Requires Chrome Canary.

Try it now in your browser:

[![Test on WordPress Playground](https://img.shields.io/badge/Test%20on%20WordPress%20Playground-3F57E1?style=for-the-badge&logo=WordPress&logoColor=ffffff)](https://playground.wordpress.net/?mode=seamless&blueprint-url=https://raw.githubusercontent.com/swissspidy/ai-experiments/main/blueprints/playground.json)

Or install and activate the latest nightly build on your own WordPress website:

[![Download latest nightly build](https://img.shields.io/badge/Download%20latest%20nightly-24282D?style=for-the-badge&logo=Files&logoColor=ffffff)](https://swissspidy.github.io/ai-experiments/nightly.zip)

## Features

### Provide tl;dr to visitors

Uses Chrome’s built-in summarization API to provide readers a short summary of the post content. The UI is powered by WordPress’ new Interactivity API.

![Content summarization example](https://github.com/user-attachments/assets/806a6ce7-91a9-481d-bf80-a91da12b765b)

https://github.com/user-attachments/assets/e25e6a70-31bf-4fa5-9143-22a7124097dc

### Writing meta descriptions based on the content

Using a simple prompt to summarize the content in only a few sentences.

https://github.com/user-attachments/assets/4aea598f-f38d-4cee-9ce0-ce09563ee537

### “Help me write”

Options for rewriting individual paragraphs à la Google Doc, like rephrasing, shortening or elaborating.

!["Help me write" integration](https://github.com/user-attachments/assets/ec0c944c-7537-480b-b026-10daa7791c0b)

https://github.com/user-attachments/assets/5cb2220f-77df-4ce2-a209-65fec02f5f57

### Generate image captions / alternative text

Uses [Transformers.js]([url](http://Transformers.js)) and [Florence-2]([url](https://huggingface.co/onnx-community/Florence-2-base-ft)) to generate image captions and alternative text for images directly in the editor. Also integrated into [Media Experiments](https://github.com/swissspidy/media-experiments), which supports video captioning too.

https://github.com/user-attachments/assets/bf516dc6-c135-4598-b77a-2f2e9f38699b

### Generate a memorable quote

A slight variation on the summarization use case, this extracts a memorable quote from the article and gives it some visual emphasis.

https://github.com/user-attachments/assets/4d439491-5d52-4183-9165-375471672414

### Assigning tags & categories to blog posts

Suggest matching tags/categories based on the content. Grabs a list of existing terms from the site and passes it to the prompt together with the post content.

https://github.com/user-attachments/assets/c1e29673-6b4d-426d-b4e5-39b846a0c6d7

### Sentiment analysis for content / comments

Using a simple prompt to say whether the text is positive or negative. Could be used to suggest rephrasing the text à la Grammarly, or identify negative comments.

https://github.com/user-attachments/assets/d1060297-fb80-4cf3-ba82-b40304846662
