#!/usr/bin/env node

import { Command } from "commander";
import { upCommand } from "./cli/commands/up.js";
import { downCommand } from "./cli/commands/down.js";
import { statusCommand } from "./cli/commands/status.js";

const program = new Command();

program.name("repdev")
    .description("A CLI for managing development environments")
    .version("1.0.0");

program.command("up")
    .description("Start the development environment")
    .option("-t, --template <path>", "Path to the template file")
    .action(upCommand);

program.command("down")
    .description("Stop and remove the development environment")
    .option("-t, --template <path>", "Path to the template file")
    .action(downCommand);

program.command("status")
    .description("Check the status of the development environment")
    .action(statusCommand);

program.parse(process.argv);