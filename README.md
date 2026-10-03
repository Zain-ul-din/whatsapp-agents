<div align="center">

## <img src="https://github.com/Zain-ul-din/whatsapp-ai-bot/assets/78583049/d31339cf-b4ae-450e-95b9-53d21e4641a0" width="35" height="35"/> WhatsApp Agents 🚀

</div>

```diff
- This repository under development, contribute to help write better docs.
```

The WhatsApp AI Agents is a chatbot that uses AI models APIs to generate responses to user input. The bot supports several AI models, including **`Gemini`**, **`ChatGPT`**, **`Ollama`**, **`DALL-E`**, **`Flux`**, and **`Stability AI`**.

# Table of Content

- [Demo](#demo)
- [Usage](#usage)
- [Tutorials](#Tutorials)
- [Docs](docs/config-docs.md)
- [Disclaimer](#disclaimer)
- [Contributors](#contributors)
- [Sponsors](#Sponsors)
- [About](#about-us)

## Supported Models

| Model         | Provider                                                                                          | Type          | Command    |
| ------------- | ------------------------------------------------------------------------------------------------- | ------------- | ---------- |
| ChatGPT       | [OpenAI](https://platform.openai.com/docs/guides/text-generation/quickstart)                      | Text to Text  | !chatgpt   |
| Gemini        | [Google](https://ai.google.dev/gemini-api/docs/text-generation?lang=node#generate-text-from-text) | Text to Text  | !gemini    |
| Gemini Vision | [Google](https://ai.google.dev/gemini-api/docs/vision?lang=node#upload-image)                     | Image to Text | none       |
| Dalle 2 & 3   | [OpenAI](https://platform.openai.com/docs/api-reference/images/create)                            | Text to Image | !dalle     |
| Flux          | [Hugging Face](https://huggingface.co/black-forest-labs/FLUX.1-dev)                               | Text to Image | !flux      |
| Stability AI  | [Stability AI](https://platform.stability.ai/docs/getting-started/stable-image)                   | Text to Image | !stability |
| Ollama        | [Open Source](https://ollama.com/)                                                                | Text to Text  | !ollama    |
| Custom        | Base Provider                                                                                     | Text to Text  | !wa        |

## Demo

### Gemini

[![Screenshot (1186)](https://github.com/Zain-ul-din/whatsapp-ai-bot/assets/78583049/b6f256de-c792-4947-bf65-401a60a0b1f4)](https://www.youtube.com/watch?v=dXDxTQQqeq8)

### Stability AI + Chat-GPT

![image](https://user-images.githubusercontent.com/78583049/222071673-ef0f2021-a8b4-4263-9304-a77ecd76c0a1.png)

### Dalle + Custom Model

![image](https://user-images.githubusercontent.com/78583049/222074174-55792d13-5137-4c1c-b708-3ad188ca8d8d.png)

---

## Usage

### 1. Download Source Code

```bash
 git clone https://github.com/Zain-ul-din/WhatsApp-Ai-bot.git
 cd WhatsApp-Ai-bot
```

> OR

- [Download Zip File](https://github.com/Zain-ul-din/WhatsApp-Ai-bot/archive/refs/heads/master.zip)

### 2. Get API Keys

- [Gemini API Key](https://aistudio.google.com/app/apikey)
- [OpenAI API Key](https://platform.openai.com/api-keys)
- [Hugging Face API Key](https://huggingface.co/settings/tokens)
- [Stability AI API Key](https://platform.stability.ai/account/keys)

### 3. Add API Keys

Copy the file `.env.example` and rename it to `.env`, then set any settings you want to change.

### 4. Run the code

- Run `npm run start` to run the bot.

- Scan QR code.

## Default Settings

- `!gemini` use gemini.
- `!chatgpt` use chat-gpt.
- `!dalle` use Dalle.
- `!flux` use flux.
- `!stability` use stability.

**Note! open `src/whatsapp-ai.config.ts` to edit config.**

[Docs Link](docs/config-docs.md)

## Tutorials

- **[Setup bot on cloud using Github code-spaces](https://www.youtube.com/watch?v=QahJSi6Ygj4)**
- **[setup bot on a local machine](https://www.youtube.com/watch?v=fyPD3ILFPck)**

### FQA

- [How to create custom model](https://github.com/Zain-ul-din/whatsapp-ai-bot/issues/3)

## Disclaimer

This bot utilizes [baileys](https://github.com/WhiskeySockets/Baileys) to operate an actual instance of Whatsapp Web to prevent blocking. However, it is essential to note that these operations come at a cost charged by OpenAI and Stability AI for every request made. Please be aware that WhatsApp does not support bots or unofficial clients on its platform, so using this method is not entirely secure and could lead to getting blocked.

## Contributors

<a href="https://github.com/Zain-ul-din/WhatsApp-Ai-bot/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=Zain-ul-din/WhatsApp-Ai-bot" />
</a>

###

- [Open issue here](./../../issues)
- [Ask Question here](./../../discussions)

<!-- about -->

## Sponsors

A big thank you to these people for supporting this project.

| ![Levitco](https://avatars.githubusercontent.com/u/47256157?v=4&s=128) | ![Anas Ashfaq](https://avatars.githubusercontent.com/u/119153707?v=4&s=128) | <img src="https://avatars.githubusercontent.com/u/0?v=4" width="150" height="150"/> |
| ---------------------------------------------------------------------- | --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Levitco                                                                | Anas Ashfaq                                                                 | YOU?                                                                                |

# Useful links

| ♥ Sponsor                                  | 💎 Bounty                                       | 🚀 Deployment                           | ✉ WhatsApp Group                  |
| ------------------------------------------ | ----------------------------------------------- | --------------------------------------- | --------------------------------- |
| [Link](https://buymeacoffee.com/zainuldin) | [Link](https://wa-ai-seven.vercel.app/feat-req) | [Link](https://wa-ai-seven.vercel.app/) | [Link](https://chat.whatsapp.com) |

<a href="https://auraplusplus.com/projects/whatsapp-ai-bot" target="_blank" rel="noopener">
  <img src="https://auraplusplus.com/images/badges/featured-on-dark.svg" alt="Featured on Aura++" />
</a>

## About Us

<div align="center">
<h4 font-weight="bold">This repository is maintained by <a href="https://github.com/Zain-ul-din">Zain-Ul-Din</a></h4>
<p> Show some ❤️ by starring this awesome repository! </p>
</div>

<div align="center">
<a href="https://www.buymeacoffee.com/zainuldin" target="_blank"><img src="https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png" alt="Buy Me A Coffee" style="height: 41px !important;width: 174px !important;box-shadow: 0px 3px 2px 0px rgba(190, 190, 190, 0.5) !important;-webkit-box-shadow: 0px 3px 2px 0px rgba(190, 190, 190, 0.5) !important;" ></a>

</div>
