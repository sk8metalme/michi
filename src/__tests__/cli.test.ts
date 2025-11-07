/**
 * CLIツールの単体テスト
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { Command } from 'commander';
import { createCLI } from '../cli.js';

describe('CLI Tool', () => {
  let program: Command;

  beforeEach(() => {
    program = createCLI();
  });

  describe('基本動作', () => {
    it('CLIツールが正しく作成される', () => {
      expect(program).toBeInstanceOf(Command);
      expect(program.name()).toBe('michi');
    });

    it('すべてのコマンドが登録されている', () => {
      const commandNames = program.commands.map(cmd => cmd.name());
      
      expect(commandNames).toContain('jira:sync');
      expect(commandNames).toContain('confluence:sync');
      expect(commandNames).toContain('phase:run');
      expect(commandNames).toContain('validate:phase');
      expect(commandNames).toContain('preflight');
      expect(commandNames).toContain('project:list');
      expect(commandNames).toContain('project:dashboard');
      expect(commandNames).toContain('workflow:run');
    });
  });

  describe('jira:syncコマンド', () => {
    it('コマンドが存在する', () => {
      const command = program.commands.find(cmd => cmd.name() === 'jira:sync');
      expect(command).toBeDefined();
      expect(command?.description()).toContain('JIRA');
    });
  });

  describe('confluence:syncコマンド', () => {
    it('コマンドが存在する', () => {
      const command = program.commands.find(cmd => cmd.name() === 'confluence:sync');
      expect(command).toBeDefined();
      expect(command?.description()).toContain('Confluence');
    });
  });

  describe('phase:runコマンド', () => {
    it('コマンドが存在する', () => {
      const command = program.commands.find(cmd => cmd.name() === 'phase:run');
      expect(command).toBeDefined();
      expect(command?.description()).toContain('phase');
    });
  });

  describe('validate:phaseコマンド', () => {
    it('コマンドが存在する', () => {
      const command = program.commands.find(cmd => cmd.name() === 'validate:phase');
      expect(command).toBeDefined();
      expect(command?.description()).toContain('Validate');
    });
  });
});

