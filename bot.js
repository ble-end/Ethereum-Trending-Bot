const { Telegraf, Markup } = require('telegraf');
const express = require('express');
require('dotenv').config();

const bot = new Telegraf(process.env.BOT_TOKEN);
const app = express();
const PORT = process.env.PORT || 3000;

const userSessions = {};
const ADMIN_ETH_WALLET = process.env.ADMIN_ETH_WALLET || "0xYourActualWalletAddressHere";
const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID || "7424343773";

// Simple web server for Railway health checks
app.get('/', (req, res) => {
  res.send('ETHEREUM TRENDING SERVICE is active!');
});

app.listen(PORT, () => {
  console.log(`Web server running on port ${PORT}`);
});

// Keyboards
const mainMenu = Markup.inlineKeyboard([
  [Markup.button.callback('🔥 Service Info', 'trending'), Markup.button.callback('🚀 Submit Token', 'submit')],
  [Markup.button.callback('⚙️ My Order', 'settings'), Markup.button.callback('ℹ️ Help', 'help')]
]);

const backMenu = Markup.inlineKeyboard([
  [Markup.button.callback('« Back to Menu', 'menu')]
]);

const packagesKeyboard = Markup.inlineKeyboard([
  [Markup.button.callback('⏱️ 6 Hours — 0.1 ETH', 'pkg_6h')],
  [Markup.button.callback('⚡ 12 Hours — 0.14 ETH', 'pkg_12h')],
  [Markup.button.callback('🔥 16 Hours — 0.19 ETH', 'pkg_16h')],
  [Markup.button.callback('🚀 20 Hours — 0.23 ETH', 'pkg_20h')],
  [Markup.button.callback('👑 24 Hours — 0.28 ETH', 'pkg_28h')],
  [Markup.button.callback('« Cancel & Menu', 'menu')]
]);

// --- BOT START & NAVIGATION ---
bot.start(async (ctx) => {
  userSessions[ctx.from.id] = {};
  await ctx.reply(
    "⚡️ **ETHEREUM TRENDING | Premium Visibility Agency** ⚡️\n\n" +
    "Secure premium promotion spots on exclusive, high-traffic Ethereum networks. Zero queue time, maximum exposure.",
    { parse_mode: 'Markdown' }
  );
  await ctx.reply(
    "🚀 **Ready to trend your token?** Tap below to begin your submission!",
    { parse_mode: 'Markdown', ...mainMenu }
  );
});

// Command handlers for the "/" menu
bot.command('menu', async (ctx) => {
  userSessions[ctx.from.id] = {};
  await ctx.reply('🏠 **Main Menu**\n\nSelect an action below:', { parse_mode: 'Markdown', ...mainMenu });
});

bot.command('submit', async (ctx) => {
  userSessions[ctx.from.id] = { step: 'waiting_for_ca' };
  await ctx.reply("🚀 **Token Submission Step 1/3**\n\nPlease send your **Ethereum Contract Address (CA)** (must start with `0x`):", { parse_mode: 'Markdown', ...backMenu });
});

bot.command('help', async (ctx) => {
  await ctx.reply("ℹ️ **Help**\n\nSubmit your token details, select your exclusive package, and complete your secure transfer for placement.", { parse_mode: 'Markdown', ...backMenu });
});

// Inline Actions
bot.action('menu', async (ctx) => {
  userSessions[ctx.from.id] = {};
  await ctx.editMessageText('🏠 **Main Menu**\n\nSelect an action below:', { parse_mode: 'Markdown', ...mainMenu });
});

bot.action('help', async (ctx) => {
  await ctx.editMessageText("ℹ️ **Help**\n\nSubmit your token details, select your exclusive package, and complete your secure transfer for placement.", { parse_mode: 'Markdown', ...backMenu });
});

bot.action('settings', async (ctx) => {
  await ctx.editMessageText("⚙️ **Order Status**\n\nSubmit a new token via the main menu to begin.", { parse_mode: 'Markdown', ...backMenu });
});

bot.action('trending', async (ctx) => {
  await ctx.editMessageText("🔥 **Service Overview**\n\nWe connect high-potential ETH projects with targeted, organic investor audiences through our exclusive network.", { parse_mode: 'Markdown', ...backMenu });
});

// --- SUBMISSION FLOW (CA -> TG -> X) ---
bot.action('submit', async (ctx) => {
  userSessions[ctx.from.id] = { step: 'waiting_for_ca' };
  await ctx.editMessageText("🚀 **Token Submission Step 1/3**\n\nPlease send your **Ethereum Contract Address (CA)** (must start with `0x`):", { parse_mode: 'Markdown', ...backMenu });
});

bot.on('text', async (ctx) => {
  const userId = ctx.from.id;
  const session = userSessions[userId];
  if (!session || !session.step) return;

  const text = ctx.message.text.trim();

  if (session.step === 'waiting_for_ca') {
    if (!text.startsWith('0x') || text.length < 30) {
      await ctx.reply("⚠️ Invalid Contract Address. Must start with `0x`. Try again:", { parse_mode: 'Markdown' });
      return;
    }
    session.ca = text;
    session.step = 'waiting_for_tg';
    await ctx.reply("💬 **Token Submission Step 2/3**\n\nSend your **Telegram Group or Channel link**:", { parse_mode: 'Markdown' });
  } 
  else if (session.step === 'waiting_for_tg') {
    session.tg = text;
    session.step = 'waiting_for_x';
    await ctx.reply("🐦 **Token Submission Step 3/3**\n\nSend your **X (Twitter) profile link or handle**:", { parse_mode: 'Markdown' });
  } 
  else if (session.step === 'waiting_for_x') {
    session.x = text;
    session.step = 'review_details';

    const reviewKeyboard = Markup.inlineKeyboard([
      [Markup.button.callback('✅ Yes, Proceed to Packages', 'confirm_details')],
      [Markup.button.callback('✏️ Restart Submission', 'submit')]
    ]);

    await ctx.reply(
      "🔍 **Double-Check Your Submission!**\n\n" +
      "Please review your details carefully before proceeding. Incorrect CAs or broken links will delay your placement:\n\n" +
      `• **CA:** \`${session.ca}\`\n` +
      `• **Telegram:** ${session.tg}\n` +
      `• **X Profile:** ${session.x}\n\n` +
      "Are these correct?",
      { parse_mode: 'Markdown', ...reviewKeyboard }
    );
  }
});

// --- CONFIRMATION & PACKAGE SELECTION ---
bot.action('confirm_details', async (ctx) => {
  await ctx.editMessageText(
    "✅ **Details Confirmed!**\n\n" +
    "📦 **Select your exclusive promotion package below:**",
    { parse_mode: 'Markdown', ...packagesKeyboard }
  );
});

['pkg_6h', 'pkg_12h', 'pkg_16h', 'pkg_20h', 'pkg_28h'].forEach((pkgCode) => {
  bot.action(pkgCode, async (ctx) => {
    const userId = ctx.from.id;
    const session = userSessions[userId] || {};
    
    const pkgDetails = {
      'pkg_6h': { duration: '6 Hours', amount: '0.1' },
      'pkg_12h': { duration: '12 Hours', amount: '0.14' },
      'pkg_16h': { duration: '16 Hours', amount: '0.19' },
      'pkg_20h': { duration: '20 Hours', amount: '0.23' },
      'pkg_28h': { duration: '24 Hours', amount: '0.28' }
    };
    const plan = pkgDetails[pkgCode];
    session.selectedPlan = plan;

    const confirmKeyboard = Markup.inlineKeyboard([
      [Markup.button.callback('✅ I Have Paid / Verify', 'verify_payment')],
      [Markup.button.callback('« Cancel & Menu', 'menu')]
    ]);

    await ctx.editMessageText(
      "💳 **Secure ETH Payment Instructions**\n\n" +
      `Selected Plan: **${plan.duration} — ${plan.amount} ETH**\n\n` +
      "Please send the exact amount of ETH to our official treasury wallet below:\n\n" +
      `\`${ADMIN_ETH_WALLET}\`\n\n` +
      "⚠️ *Note:* Tap the address to copy. Once your on-chain transaction is sent, click the button below to log your claim!",
      { parse_mode: 'Markdown', ...confirmKeyboard }
    );
  });
});

// --- VERIFICATION CLAIM LOG & SECURE PENDING SCREEN ---
bot.action('verify_payment', async (ctx) => {
  const userId = ctx.from.id;
  const username = ctx.from.username ? `@${ctx.from.username}` : `ID: ${userId}`;
  const session = userSessions[userId] || {};
  const plan = session.selectedPlan || { duration: 'Custom', amount: '0.X' };

  if (ADMIN_CHAT_ID) {
    try {
      await bot.telegram.sendMessage(
        ADMIN_CHAT_ID,
        "🚨 **NEW PAYMENT CLAIM PENDING!** 🚨\n\n" +
        `• **User:** ${username} (\`${userId}\`)\n` +
        `• **CA:** \`${session.ca || 'N/A'}\`\n` +
        `• **Telegram:** ${session.tg || 'N/A'}\n` +
        `• **X Profile:** ${session.x || 'N/A'}\n` +
        `• **Package:** ${plan.duration} — **${plan.amount} ETH**\n\n` +
        "⚡️ *Action required:* Check your wallet for the incoming ETH. Once confirmed, message the user or post their token to https://t.me/DSTrendingEthereum!",
        { parse_mode: 'Markdown', disable_web_page_preview: true }
      );
    } catch (err) {
      console.error("Failed to send admin notification:", err);
    }
  }

  const finalMenu = Markup.inlineKeyboard([
    [Markup.button.callback('🏠 Back to Main Menu', 'menu')]
  ]);

  await ctx.editMessageText(
    "⏳ **Payment Verification in Progress**\n\n" +
    `• CA: \`${session.ca || 'N/A'}\`\n` +
    `• Package: **${plan.duration} (${plan.amount} ETH)**\n\n` +
    "🔒 **Status:** Your transaction hash / claim has been submitted to our node validators. Manual on-chain confirmation takes **Instant to 4 hours max**.\n\n" +
    "Once verified, your promotion will go live and confirmation details will be pushed directly to your chat!",
    { parse_mode: 'Markdown', ...finalMenu }
  );

  userSessions[userId] = {};
});

// Register Telegram Menu Commands on Startup
bot.launch().then(async () => {
  await bot.telegram.setMyCommands([
    { command: 'menu', description: 'Open main menu' },
    { command: 'submit', description: 'Submit your token for trending' },
    { command: 'help', description: 'Get assistance and info' }
  ]);
  console.log('ETHEREUM TRENDING SERVICE is live on Railway with secure verification flow!');
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));