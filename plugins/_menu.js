const plugins = require("../lib/plugins");
const { bot, isPrivate } = require("../lib");
const { OWNER_NAME, BOT_NAME, HANDLERS } = require("../config");

// optional: set MENU_IMAGE env to an image URL to show it on the menu
const MENU_IMAGE = process.env.MENU_IMAGE || "https://xenocdn.xenocdn.workers.dev/397a6dce.jpeg";

const contextInfo = {
  forwardingScore: 1,
  isForwarded: true,
  forwardedNewsletterMessageInfo: {
    newsletterJid: "120363404471968952@newsletter",
    newsletterName: BOT_NAME,
    serverMessageId: -1,
  },
};

// command name from a registered pattern (or undefined)
const cmdName = (command) => {
  if (!(command.pattern instanceof RegExp)) return undefined;
  const name = command.pattern.toString().split(/\W+/)[1];
  return name ? name.trim() : undefined;
};

const quotedOf = (message) => ({
  key: message.key,
  message: { conversation: message.text || message.body || "" },
});

bot(
  {
    pattern: "menu",
    fromMe: isPrivate,
    desc: "Show All Commands",
    dontAddCommandList: true,
    type: "user",
  },
  async (message, match) => {
    const handlerChar = HANDLERS.replace(/\[|\]/g, "").charAt(0);

    if (match) {
      for (let i of plugins.commands) {
        if (
          i.pattern instanceof RegExp &&
          i.pattern.test(message.prefix + match)
        ) {
          const name = cmdName(i);
          return message.reply(
            `Command: ${message.prefix}${name}\nDescription: ${i.desc}`
          );
        }
      }
    }

    const { prefix } = message;
    const [date, time] = new Date()
      .toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })
      .split(",");

    let menu = `╭━ᆫ ${BOT_NAME} ᄀ━
┃ ⎆  OWNER   : ${OWNER_NAME}
┃ ⎆  PREFIX  : ${prefix}
┃ ⎆  DATE    : ${date}
┃ ⎆  TIME    : ${time}
┃ ⎆  COMMANDS: ${plugins.commands.length}
╰━━━━━━━━━━━━\n`;

    const cmnd = [];
    for (const command of plugins.commands) {
      const name = cmdName(command);
      if (!command.dontAddCommandList && name !== undefined) {
        cmnd.push({ cmd: name, type: (command.type || "misc").toLowerCase() });
      }
    }
    cmnd.sort((a, b) => a.type.localeCompare(b.type) || a.cmd.localeCompare(b.cmd));

    let lastType = null;
    for (const { cmd, type } of cmnd) {
      if (type !== lastType) {
        menu += `\n*${type.toUpperCase()}*`;
        lastType = type;
      }
      menu += `\n> ${cmd}`;
    }

    const quoted = { quoted: message.data };
    try {
      await message.client.sendMessage(
        message.jid,
        {
          ...(MENU_IMAGE
            ? { image: { url: MENU_IMAGE }, caption: menu }
            : { text: menu }),
          title: "",
          subtitle: "Connect with us",
          footer: "Open Base",
          interactiveButtons: [
            {
              name: "quick_reply",
              buttonParamsJson: JSON.stringify({
                display_text: "Owner",
                id: `${handlerChar}owner`,
              }),
            },
            {
              name: "cta_url",
              buttonParamsJson: JSON.stringify({
                display_text: "Telegram Support",
                url: "https://t.me/izumi_xddd",
              }),
            },
            {
              name: "cta_url",
              buttonParamsJson: JSON.stringify({
                display_text: "WhatsApp Channel",
                url: "https://whatsapp.com/channel/0029Vaf2tKvGZNCmuSg8ma2O",
              }),
            },
          ],
          contextInfo,
          viewOnce: true,
        },
        quoted
      );
    } catch (e) {
      // buttons/image failed -> plain text fallback so the menu always works
      console.error("menu button send failed:", e.message);
      await message.client.sendMessage(
        message.jid,
        { text: menu, contextInfo },
        quoted
      );
    }
  }
);

bot(
  {
    pattern: "list",
    fromMe: isPrivate,
    desc: "Show All Commands",
    type: "user",
    dontAddCommandList: true,
  },
  async (message) => {
    const cmnd = [];
    for (const command of plugins.commands) {
      const name = cmdName(command);
      if (!command.dontAddCommandList && name !== undefined) {
        cmnd.push({ cmd: name, desc: command.desc || false });
      }
    }
    cmnd.sort((a, b) => a.cmd.localeCompare(b.cmd));

    let menu = "Command List\n";
    cmnd.forEach(({ cmd, desc }, num) => {
      menu += `\n${num + 1}. ${cmd}\n`;
      if (desc) menu += `Use: ${desc}\n`;
    });

    return await message.client.sendMessage(
      message.jid,
      { text: menu, contextInfo },
      { quoted: quotedOf(message) }
    );
  }
);

bot(
  {
    pattern: "ping",
    fromMe: isPrivate,
    desc: "To check if the bot is awake",
    type: "user",
  },
  async (message) => {
    const start = Date.now();
    for (let i = 0; i < 1e6; i++) Math.sqrt(i);
    const speed = Date.now() - start;

    await message.client.sendMessage(
      message.jid,
      { text: `Bot speed: ${speed} ms`, contextInfo },
      { quoted: quotedOf(message) }
    );
  }
);

bot(
  {
    pattern: "reboot$",
    fromMe: true,
    desc: "Restart the bot",
    type: "user",
  },
  async (message) => {
    await message.sendMessage(message.jid, "_rebooting_");
    // pm2 (npm start) restarts the process automatically after exit
    setTimeout(() => process.exit(0), 1000);
  }
);
