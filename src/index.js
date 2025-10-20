#!/usr/bin/env node

import { Command } from "commander";
import { upCommand } from "./cli/commands/up.js";
import { downCommand } from "./cli/commands/down.js";
import { statusCommand } from "./cli/commands/status.js";
import { validateCommand } from "./cli/commands/validate.js";
import { initCommand } from "./cli/commands/init.js";
import { logsCommand } from "./cli/commands/logs.js";
import { execCommand } from "./cli/commands/exec.js";
import { restartCommand } from "./cli/commands/restart.js";

const program = new Command();

program.name("repdev")
    .description("A CLI for managing development environments")
    .version("1.0.0");

program.command("up")
    .description("Start the development environment")
    .option("-t, --template <path>", "Path to the template file")
    .option("-p, --preset <name>", "Environment preset (e.g., mern, django)")
    .option("-f, --force", "Force recreate containers even if running")
    .option("-d, --dry-run", "Show intended actions without mutating state")
    .option("-s, --services <names>", "Comma-separated list of service names to operate on")
    .option("-c, --compose", "Generate docker-compose.yml and run docker compose up -d")
    .option("--no-wait", "Skip readiness checks (start containers without waiting)")
    .action(upCommand);

program.command("down")
    .description("Stop and remove the development environment")
    .option("-t, --template <path>", "Path to the template file")
    .option("-p, --preset <name>", "Environment preset (e.g., mern, django)")
    .option("-f, --force", "Force remove running containers")
    .option("-s, --services <names>", "Comma-separated list of service names to operate on")
    .option("-d, --dry-run", "Show intended actions without mutating state")
    .option("-c, --compose", "Generate docker-compose.yml and run docker compose down")
    .action(downCommand);

program.command("status")
    .description("Check the status of the development environment")
    .action(statusCommand);

program.command("validate")
    .description("Validate a template file without starting containers")
    .option("-t, --template <path>", "Path to the template file")
    .option("-p, --preset <name>", "Environment preset (e.g., mern, django)")
    .action(validateCommand);

program.command("init")
    .description("Create a starter repdev.yml in the current directory")
    .option("-p, --preset <name>", "Environment preset (e.g., mern, django)")
    .option("-l, --list", "List available presets")
    .option("-f, --force", "Overwrite if repdev.yml already exists")
    .action(initCommand);

program.command("logs <service>")
    .description("View logs from a service container")
    .option("-t, --template <path>", "Path to the template file")
    .option("-p, --preset <name>", "Environment preset")
    .option("-f, --follow", "Follow log output (like tail -f)")
    .option("--tail <lines>", "Number of lines to show from the end (default: 100)")
    .action(logsCommand);

program.command("exec <service> [command...]")
    .description("Execute a command in a service container")
    .option("-t, --template <path>", "Path to the template file")
    .option("-p, --preset <name>", "Environment preset")
    .action(execCommand);

program.command("restart [service]")
    .description("Restart a service container")
    .option("-t, --template <path>", "Path to the template file")
    .option("-p, --preset <name>", "Environment preset")
    .option("-a, --all", "Restart all services")
    .action(restartCommand);

program.parse(process.argv);