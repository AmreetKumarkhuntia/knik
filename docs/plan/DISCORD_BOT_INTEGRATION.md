# Discord Bot Integration Documentation

## Table of Contents
1. [Introduction](#introduction)
2. [Prerequisites](#prerequisites)
3. [Setting Up a Discord Bot](#setting-up-a-discord-bot)
4. [Creating Your Bot Application](#creating-your-bot-application)
5. [Installation and Setup](#installation-and-setup)
6. [Basic Bot Code](#basic-bot-code)
7. [Common Bot Features](#common-bot-features)
8. [Commands and Events](#commands-and-events)
9. [Deployment](#deployment)
10. [Best Practices](#best-practices)
11. [Troubleshooting](#troubleshooting)
12. [Resources](#resources)

---

## Introduction

This guide provides comprehensive documentation for integrating and developing Discord bots. Discord bots are automated programs that perform various tasks within Discord servers, from moderation to entertainment and utility functions.

### What is a Discord Bot?
A Discord bot is a user account controlled by code that can interact with Discord servers, channels, and users. Bots can:
- Send and receive messages
- Manage server roles and permissions
- Play music
- Moderate chat
- Provide utility functions
- Integrate with external APIs

---

## Prerequisites

Before you start creating a Discord bot, ensure you have:

1. **A Discord account** - You need a Discord account to create and manage bot applications
2. **Basic programming knowledge** - Python is commonly used, but other languages like JavaScript, Java, and C# are also supported
3. **Code editor** - VS Code, PyCharm, or your preferred IDE
4. **Command line/terminal access**
5. **Bot token storage** - Never hardcode bot tokens in your source code

---

## Setting Up a Discord Bot

### 1. Create Discord Developer Account
1. Go to the [Discord Developer Portal](https://discord.com/developers/applications)
2. Log in with your Discord account
3. Click "New Application"
4. Give your application a name and click "Create"

### 2. Create Bot User
1. In your application, click on the "Bot" tab
2. Click "Add Bot"
3. Confirm by clicking "Yes, do it!"

### 3. Get Bot Token
1. Under the bot section, click "Reset Token" (or "Copy Token" if already generated)
2. **IMPORTANT**: Save this token securely. It's like your bot's password
3. Never share this token publicly or commit it to version control

### 4. Enable Privileged Gateway Intents
Depending on your bot's functionality, you may need to enable privileged intents:
1. Scroll down to "Privileged Gateway Intents"
2. Enable:
   - **Message Content Intent** - For reading message content
   - **Server Members Intent** - For accessing server member information
   - **Presence Intent** - For seeing user status/activity

---

## Creating Your Bot Application

### Python Example (Using discord.py)

This is the most popular library for Discord bot development in Python.

#### Installation
```bash
pip install discord.py
```

#### Basic Bot Structure
```python
import discord
import os
from discord.ext import commands

# Set up intents
intents = discord.Intents.default()
intents.message_content = True  # Required for message content
intents.members = True  # Required for member events

# Create bot instance
bot = commands.Bot(command_prefix='!', intents=intents)

@bot.event
async def on_ready():
    print(f'{bot.user} has connected to Discord!')
    print(f'Bot is in {len(bot.guilds)} servers')

# Basic command
@bot.command()
async def hello(ctx):
    await ctx.send(f'Hello, {ctx.author.mention}!')

# Run the bot
BOT_TOKEN = os.getenv('DISCORD_TOKEN')  # Use environment variable
bot.run(BOT_TOKEN)
```

---

## Installation and Setup

### Environment Setup
1. **Create a virtual environment** (recommended):
```bash
python -m venv discord_bot_env
source discord_bot_env/bin/activate  # On Windows: discord_bot_env\Scripts\activate
```

2. **Install required packages**:
```bash
pip install discord.py python-dotenv
```

3. **Create environment file**:
Create a `.env` file in your project root:
```
DISCORD_TOKEN=your_bot_token_here
```

### Project Structure
```
discord_bot/
├── .env                    # Environment variables
├── .gitignore              # Git ignore file
├── main.py                 # Main bot file
├── cogs/                   # Command modules
│   ├── admin.py
│   ├── fun.py
│   └── utility.py
├── config.py               # Configuration settings
└── requirements.txt        # Python dependencies
```

---

## Basic Bot Code

### Complete Basic Example
```python
import discord
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Set up intents
intents = discord.Intents.default()
intents.message_content = True

class MyBot(discord.Client):
    async def on_ready(self):
        print(f'Logged in as {self.user}')
        print(f'Bot ID: {self.user.id}')
        print('------')

        # Set bot status
        await self.change_presence(activity=discord.Game(name="Hello World!"))

    async def on_message(self, message):
        # Don't respond to own messages
        if message.author == self.user:
            return

        # Simple ping-pong
        if message.content.lower() == 'ping':
            await message.channel.send('Pong!')

        # Greeting command
        elif message.content.lower() == 'hello':
            await message.channel.send(f'Hello, {message.author.mention}!')

# Initialize and run bot
client = MyBot(intents=intents)
client.run(os.getenv('DISCORD_TOKEN'))
```

---

## Common Bot Features

### 1. Command Handling
Using the commands extension for better command management:

```python
from discord.ext import commands

bot = commands.Bot(command_prefix='!', intents=intents)

@bot.command(name='info')
async def server_info(ctx):
    """Display server information"""
    server = ctx.guild
    member_count = server.member_count
    channel_count = len(server.channels)

    embed = discord.Embed(
        title=f"{server.name} Information",
        description=f"Server ID: {server.id}",
        color=discord.Color.blue()
    )

    embed.add_field(name="Members", value=member_count, inline=True)
    embed.add_field(name="Channels", value=channel_count, inline=True)
    embed.add_field(name="Owner", value=server.owner.mention, inline=True)
    embed.add_field(name="Created", value=server.created_at.strftime("%Y-%m-%d"), inline=True)

    await ctx.send(embed=embed)
```

### 2. Moderation Commands
```python
@bot.command()
@commands.has_permissions(kick_members=True)
async def kick(ctx, member: discord.Member, *, reason="No reason provided"):
    """Kick a member from the server"""
    await member.kick(reason=reason)
    await ctx.send(f'Kicked {member.mention} for: {reason}')

@bot.command()
@commands.has_permissions(ban_members=True)
async def ban(ctx, member: discord.Member, *, reason="No reason provided"):
    """Ban a member from the server"""
    await member.ban(reason=reason)
    await ctx.send(f'Banned {member.mention} for: {reason}')
```

### 3. Fun Commands
```python
@bot.command()
async def avatar(ctx, member: discord.Member = None):
    """Display a user's avatar"""
    if member is None:
        member = ctx.author

    embed = discord.Embed(title=f"{member.name}'s Avatar")
    embed.set_image(url=member.avatar.url)
    await ctx.send(embed=embed)

@bot.command()
async def roll(ctx, sides: int = 6):
    """Roll a dice with specified number of sides"""
    import random
    result = random.randint(1, sides)
    await ctx.send(f'🎲 You rolled a {sides}-sided die: **{result}**')
```

### 4. Utility Commands
```python
@bot.command()
async def poll(ctx, *, question):
    """Create a simple poll"""
    embed = discord.Embed(
        title="📊 Poll",
        description=question,
        color=discord.Color.blue()
    )

    poll_message = await ctx.send(embed=embed)
    await poll_message.add_reaction("👍")
    await poll_message.add_reaction("👎")
```

---

## Commands and Events

### Common Events
```python
# User joins server
@bot.event
async def on_member_join(member):
    # Get welcome channel (by name or ID)
    welcome_channel = member.guild.get_channel(CHANNEL_ID)
    if welcome_channel:
        embed = discord.Embed(
            title="Welcome!",
            description=f"Welcome to {member.guild.name}, {member.mention}!",
            color=discord.Color.green()
        )
        await welcome_channel.send(embed=embed)

# User leaves server
@bot.event
async def on_member_remove(member):
    # Send farewell message
    farewell_channel = member.guild.get_channel(CHANNEL_ID)
    if farewell_channel:
        embed = discord.Embed(
            title="Goodbye!",
            description=f"{member.name} has left the server.",
            color=discord.Color.red()
        )
        await farewell_channel.send(embed=embed)

# Message deletion
@bot.event
async def on_message_delete(message):
    # Log deleted messages (optional)
    log_channel = message.guild.get_channel(LOG_CHANNEL_ID)
    if log_channel and not message.author.bot:
        embed = discord.Embed(
            title="Message Deleted",
            description=f"Message by {message.author.mention} in {message.channel.mention}",
            color=discord.Color.orange()
        )
        embed.add_field(name="Content", value=message.content[:1000])
        await log_channel.send(embed=embed)
```

### Command Groups
```python
@bot.group()
async def config(ctx):
    """Configuration commands"""
    if ctx.invoked_subcommand is None:
        await ctx.send("Please specify a configuration option. Use !help config for more info.")

@config.command()
async def prefix(ctx, new_prefix: str):
    """Change bot prefix (admin only)"""
    if ctx.author.guild_permissions.administrator:
        # Update prefix logic here
        await ctx.send(f"Prefix changed to: {new_prefix}")
    else:
        await ctx.send("You don't have permission to change the prefix!")
```

---

## Deployment

### Local Development
1. **Run the bot**:
```bash
python main.py
```

2. **Keep the bot running**:
- Use `screen` or `tmux` for persistent sessions
- Or run as a system service

### Cloud Deployment
#### Using Heroku (Free Option)
1. **Create Heroku account** and install Heroku CLI
2. **Initialize Git repository**:
```bash
git init
git add .
git commit -m "Initial bot commit"
```

3. **Create Heroku app**:
```bash
heroku create your-bot-name
```

4. **Set environment variables**:
```bash
heroku config:set DISCORD_TOKEN=your_token_here
```

5. **Create Procfile** (no extension):
```
worker: python main.py
```

6. **Deploy**:
```bash
git push heroku main
heroku ps:scale worker=1
```

#### Using VPS/Dedicated Server
1. **Set up a systemd service**:
Create `/etc/systemd/system/discord-bot.service`:
```ini
[Unit]
Description=Discord Bot
After=network.target

[Service]
User=your_username
WorkingDirectory=/path/to/your/bot
ExecStart=/usr/bin/python3 /path/to/your/bot/main.py
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

2. **Enable and start the service**:
```bash
sudo systemctl daemon-reload
sudo systemctl enable discord-bot
sudo systemctl start discord-bot
```

---

## Best Practices

### 1. Security
- **Never hardcode tokens** - Use environment variables
- **Use `.env` files** for local development
- **Add `.env` to `.gitignore`**:
```
# Environment variables
.env
.env.local
.env.*.local

# Bot tokens
*.token
```

### 2. Error Handling
```python
@bot.event
async def on_command_error(ctx, error):
    if isinstance(error, commands.MissingPermissions):
        await ctx.send("You don't have permission to use this command!")
    elif isinstance(error, commands.CommandNotFound):
        pass  # Ignore command not found errors
    else:
        print(f"Error: {error}")
```

### 3. Performance
- **Use caching** for frequently accessed data
- **Avoid blocking operations** - use `asyncio` for async tasks
- **Implement cooldowns** for frequently used commands:
```python
@bot.command()
@commands.cooldown(1, 5, commands.BucketType.user)  # 1 use per 5 seconds per user
async def spam(ctx):
    await ctx.send("This command has a cooldown!")
```

### 4. User Experience
- **Provide help messages** - use `!help` command
- **Use embeds** for better message formatting
- **Add loading indicators** for long-running operations

---

## Troubleshooting

### Common Issues

#### 1. "Privileged intent" errors
**Problem**: Bot can't read message content or access member information
**Solution**: Enable privileged intents in the Discord Developer Portal:
1. Go to your application → Bot tab
2. Scroll down to "Privileged Gateway Intents"
3. Enable required intents
4. Restart your bot

#### 2. "Missing Permissions" errors
**Problem**: Bot can't perform actions like kick/ban
**Solution**:
1. Invite bot with proper permissions:
   ```
   https://discord.com/api/oauth2/authorize?client_id=YOUR_BOT_ID&permissions=8&scope=bot%20applications.commands
   ```
2. Change permissions number (8 = Administrator, specific permissions available)

#### 3. Connection issues
**Problem**: Bot won't connect or keeps disconnecting
**Solution**:
- Check internet connection
- Verify bot token is correct
- Check Discord API status
- Review error messages in console

#### 4. Commands not working
**Problem**: Commands don't respond
**Solution**:
- Check command prefix
- Verify bot has message content intent
- Check for syntax errors in code
- Ensure bot has proper channel permissions

### Debugging Tips
1. **Add logging**:
```python
import logging

logging.basicConfig(level=logging.DEBUG)
```

2. **Use try-catch blocks**:
```python
try:
    # Your code here
except Exception as e:
    print(f"Error: {e}")
```

3. **Test commands in a private server** before deploying to production

---

## Resources

### Official Documentation
- [Discord API Documentation](https://discord.com/developers/docs/intro)
- [discord.py Documentation](https://discordpy.readthedocs.io/)
- [Discord.js Documentation](https://discord.js.org/) (JavaScript alternative)

### Learning Resources
- [Discord.py Tutorial Series](https://discordpy.readthedocs.io/en/stable/quickstart.html)
- [Discord Developer Portal](https://discord.com/developers/applications)
- [Discord Bots Community](https://discord.gg/discord-developers)

### Tools and Libraries
- **discord.py** - Python library for Discord
- **Discord.js** - JavaScript library for Discord
- **Discordgo** - Go library for Discord
- **JDA** - Java Discord API wrapper

### Hosting Options
- **Free**: Heroku, Replit, Glitch
- **Paid**: DigitalOcean, AWS, Google Cloud, VPS

### Community Support
- [Discord Developer Server](https://discord.gg/discord-developers)
- [Discord.py Server](https://discord.gg/r3sSKJJ)
- Stack Overflow (tag: discord.py)

---

This documentation provides a comprehensive foundation for Discord bot development. Remember to start simple, test thoroughly, and gradually add more complex features as you become comfortable with the API.
