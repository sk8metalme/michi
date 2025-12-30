/**
 * Phase Command Registration
 *
 * Registers all phase-related CLI commands
 */

import { Command } from 'commander';
import { runPhase } from '../../../../scripts/phase-runner.js';
import { validatePhase } from '../../../../scripts/validate-phase.js';
import { runPreFlightCheck } from '../../../../scripts/pre-flight-check.js';

/**
 * Register phase-related commands
 */
export function registerPhaseCommands(program: Command): void {
  program
    .command('phase:run')
    .description('Run complete phase workflow')
    .argument('<feature>', 'Feature name')
    .argument(
      '<phase>',
      'Phase name (requirements, design, tasks, environment-setup, phase-a, phase-b)',
    )
    .action(async (feature: string, phase: string) => {
      const validPhases = [
        'requirements',
        'design',
        'tasks',
        'environment-setup',
        'phase-a',
        'phase-b',
      ];
      if (!validPhases.includes(phase)) {
        console.error(`❌ Invalid phase. Must be: ${validPhases.join(', ')}`);
        process.exit(1);
      }

      try {
        const result = await runPhase(
          feature,
          phase as
            | 'requirements'
            | 'design'
            | 'tasks'
            | 'environment-setup'
            | 'phase-a'
            | 'phase-b',
        );
        if (result.success) {
          console.log('\n✅ Phase completed');
        } else {
          console.log('\n❌ Phase incomplete (check errors above)');
          process.exit(1);
        }
      } catch (error) {
        handleError('Phase execution failed', error);
      }
    });

  program
    .command('validate:phase')
    .description('Validate phase completion')
    .argument('<feature>', 'Feature name')
    .argument(
      '<phase>',
      'Phase name (requirements, design, tasks, environment-setup, phase-a, phase-b)',
    )
    .action(async (feature: string, phase: string) => {
      const validPhases = [
        'requirements',
        'design',
        'tasks',
        'environment-setup',
        'phase-a',
        'phase-b',
      ];
      if (!validPhases.includes(phase)) {
        console.error(`❌ Invalid phase. Must be: ${validPhases.join(', ')}`);
        process.exit(1);
      }

      try {
        const result = validatePhase(
          feature,
          phase as
            | 'requirements'
            | 'design'
            | 'tasks'
            | 'environment-setup'
            | 'phase-a'
            | 'phase-b',
        );
        process.exit(result.success ? 0 : 1);
      } catch (error) {
        handleError('Validation failed', error);
      }
    });

  program
    .command('preflight')
    .description('Run pre-flight checks')
    .argument('[phase]', 'Check phase (confluence, jira, all)', 'all')
    .action(async (phase: string) => {
      const validPhases = ['confluence', 'jira', 'all'];
      if (!validPhases.includes(phase)) {
        console.error(`❌ Invalid phase. Must be: ${validPhases.join(', ')}`);
        process.exit(1);
      }

      try {
        const result = await runPreFlightCheck(
          phase as 'confluence' | 'jira' | 'all',
        );
        process.exit(result.valid ? 0 : 1);
      } catch (error) {
        handleError('Pre-flight check failed', error);
      }
    });
}

/**
 * Handle command errors
 */
function handleError(message: string, error: unknown): never {
  console.error(
    `❌ ${message}:`,
    error instanceof Error ? error.message : error,
  );
  process.exit(1);
}
