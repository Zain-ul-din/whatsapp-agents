<div align="center">

## <img src="https://github.com/Zain-ul-din/whatsapp-ai-bot/assets/78583049/d31339cf-b4ae-450e-95b9-53d21e4641a0" width="35" height="35"/> WhatsApp Agents 🚀

</div>

```diff
- Disclaimer: This project is under active development. Features and documentation may change; contributions to improve the docs are welcome.
```

WhatsApp Agents connects an AI agent to WhatsApp. Incoming messages are queued per conversation and answered by an agent that can use tools such as web search. The agent's behaviour is set by an editable instructions file, not by code.

# Table of Content

- [Features](#features)
- [Usage](#usage)
- [Deployment](docs/deployment.md)
- [Disclaimer](#disclaimer)
- [Contributors](#contributors)
- [Sponsors](#sponsors)
- [About](#about-us)

## Features

- WhatsApp connection via [Baileys](https://github.com/WhiskeySockets/Baileys), with QR login and persistent sessions
- Messages are batched per conversation and answered with prior context
- OpenAI models through a ChatGPT subscription
- Web search tool powered by [Exa](https://exa.ai/)
- Agent instructions loaded from `agents/instructions.md`

## Usage

### 1. Get the code

```bash
git clone https://github.com/Zain-ul-din/WhatsApp-Ai-bot.git
cd WhatsApp-Ai-bot
pnpm install
```

### 2. Configure

Copy `.env.example` to `.env` and fill in the credentials. Then write your agent's instructions in `agents/instructions.md`. If the file is missing, a generic default is used.

### 3. Run

```bash
pnpm start
```

Scan the QR code with WhatsApp (Linked devices → Link a device).

## Disclaimer

This bot utilizes [baileys](https://github.com/WhiskeySockets/Baileys) to operate an actual instance of Whatsapp Web to prevent blocking. However, it is essential to note that model and tool providers may charge for every request made. Please be aware that WhatsApp does not support bots or unofficial clients on its platform, so using this method is not entirely secure and could lead to getting blocked.

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
