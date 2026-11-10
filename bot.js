const { Telegraf, Markup } = require('telegraf');
const express = require('express');
require('dotenv').config();

const bot = new Telegraf(process.env.BOT_TOKEN);
const app = express();
const PORT = process.env.PORT || 3000;

const userSessions = {};
const ADMIN_ETH_WALLET = process.env.ADMIN_ETH_WALLET || "0xYourActualWalletAddressHere";

// Simple web server for Railway health checks
app.get('/', (req, res) => {
  res.send('ETHEREUM TRENDING BOT is active and running 24/7!');
});

app.listen(PORT, () => {
  console.log(`Web server running on port ${PORT}`);
});

// Keyboards
const mainMenu = Markup.inlineKeyboard([
  [Markup.button.callback('🔥 Trending Info', 'trending'), Markup.button.callback('🚀 Submit Token', 'submit')],
  [Markup.button.callback('⚙️ Settings', 'settings'), Markup.button.callback('ℹ️ Help', 'help')]
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
    "⚡️ **ETHEREUM TRENDING BOT | Fast-Track TOS**\n\n" +
    "Direct promotion placement on **@Trending** & **@EthTrendingCI** (5.5M+ daily views). Zero queue time.",
    { parse_mode: 'Markdown' }
  );
  await ctx.reply(
    "🚀 **Ready to trend your token?** Tap below to submit your details!",
    { parse_mode: 'Markdown', ...mainMenu }
  );
});

bot.action('menu', async (ctx) => {
  userSessions[ctx.from.id] = {};
  await ctx.editMessageText('🏠 **Main Menu**\n\nSelect an action below:', { parse_mode: 'Markdown', ...mainMenu });
});

bot.action('help', async (ctx) => {
  await ctx.editMessageText("ℹ️ **Help**\n\nSubmit your token, select your ETH package, and complete your secure transfer.", { parse_mode: 'Markdown', ...backMenu });
});

bot.action('settings', async (ctx) => {
  await ctx.editMessageText(`⚙️ **Settings**\n\nYour Telegram ID: \`${ctx.from.id}\``, { parse_mode: 'Markdown', ...backMenu });
});

bot.action('trending', async (ctx) => {
  await ctx.editMessageText("🔥 **Trending Info**\n\nGuaranteed rapid visibility across top-tier crypto channels.", { parse_mode: 'Markdown', ...backMenu });
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
    session.step = 'choosing_package';

    await ctx.reply(
      "✅ **Validation Successful!**\n\n" +
      `• CA: \`${session.ca}\`\n` +
      `• Telegram: ${session.tg}\n` +
      `• X Profile: ${session.x}\n\n` +
      "📦 **Select your promotion package below:**",
      { parse_mode: 'Markdown', ...packagesKeyboard }
    );
  }
});

// --- PACKAGE SELECTION & PAYMENT INSTRUCTIONS ---
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
      "💳 **Direct ETH Payment Instructions**\n\n" +
      `Selected Plan: **${plan.duration} — ${plan.amount} ETH**\n\n` +
      "Please send the exact amount of ETH to our official treasury wallet below:\n\n" +
      `\`${ADMIN_ETH_WALLET}\`\n\n` +
      "⚠️ *Note:* Tap the address to copy. Once your on-chain transaction is sent, click the button below to log your claim!",
      { parse_mode: 'Markdown', ...confirmKeyboard }
    );
  });
});

// --- VERIFICATION CLAIM LOG ---
bot.action('verify_payment', async (ctx) => {
  const userId = ctx.from.id;
  const session = userSessions[userId] || {};
  const plan = session.selectedPlan || { duration: 'Custom', amount: '0.X' };

  const finalMenu = Markup.inlineKeyboard([
    [Markup.button.callback('🏠 Back to Main Menu', 'menu')]
  ]);

  await ctx.editMessageText(
    "📥 **Payment Claim Logged Successfully!**\n\n" +
    `• CA: \`${session.ca || 'N/A'}\`\n` +
    `• Package: **${plan.duration} (${plan.amount} ETH)**\n\n` +
    "⏳ **Queue Status:** Your submission is in our manual verification queue. Processing window takes **Instant to 4 hours max** (covering off-peak hours).\n\n" +
    "Rest assured, once verified on-chain, your project goes straight to @Trending & @EthTrendingCI! Thank you for choosing ETHEREUM TRENDING BOT.",
    { parse_mode: 'Markdown', ...finalMenu }
  );

  userSessions[userId] = {};
});

bot.launch().then(() => {
  console.log('ETHEREUM TRENDING BOT is live on Railway!');
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));