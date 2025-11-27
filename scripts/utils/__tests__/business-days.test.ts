/**
 * business-days.ts のユニットテスト
 */

import { describe, it, expect } from 'vitest';
import {
  isBusinessDay,
  addBusinessDays,
  getWeekdayChar,
  getWeekdayNotation,
  getWeekdayRangeNotation,
  getWeekNumber,
  ensureBusinessDay,
} from '../business-days.js';

describe('business-days', () => {
  describe('isBusinessDay', () => {
    it('月曜日は営業日', () => {
      const monday = new Date('2025-11-24'); // 月曜日
      expect(isBusinessDay(monday)).toBe(true);
    });

    it('火曜日は営業日', () => {
      const tuesday = new Date('2025-11-25');
      expect(isBusinessDay(tuesday)).toBe(true);
    });

    it('水曜日は営業日', () => {
      const wednesday = new Date('2025-11-26');
      expect(isBusinessDay(wednesday)).toBe(true);
    });

    it('木曜日は営業日', () => {
      const thursday = new Date('2025-11-27');
      expect(isBusinessDay(thursday)).toBe(true);
    });

    it('金曜日は営業日', () => {
      const friday = new Date('2025-11-28');
      expect(isBusinessDay(friday)).toBe(true);
    });

    it('土曜日は営業日でない', () => {
      const saturday = new Date('2025-11-29');
      expect(isBusinessDay(saturday)).toBe(false);
    });

    it('日曜日は営業日でない', () => {
      const sunday = new Date('2025-11-30');
      expect(isBusinessDay(sunday)).toBe(false);
    });
  });

  describe('addBusinessDays', () => {
    it('月曜日から1営業日後は火曜日', () => {
      const monday = new Date('2025-11-24');
      const result = addBusinessDays(monday, 1);
      expect(result.toISOString().split('T')[0]).toBe('2025-11-25');
    });

    it('金曜日から1営業日後は月曜日（土日をスキップ）', () => {
      const friday = new Date('2025-11-28');
      const result = addBusinessDays(friday, 1);
      expect(result.toISOString().split('T')[0]).toBe('2025-12-01');
    });

    it('月曜日から5営業日後は翌週月曜日', () => {
      const monday = new Date('2025-11-24');
      const result = addBusinessDays(monday, 5);
      expect(result.toISOString().split('T')[0]).toBe('2025-12-01');
    });

    it('0営業日加算は同じ日付', () => {
      const monday = new Date('2025-11-24');
      const result = addBusinessDays(monday, 0);
      expect(result.toISOString().split('T')[0]).toBe('2025-11-24');
    });

    it('木曜日から2営業日後は月曜日（週末をまたぐ）', () => {
      const thursday = new Date('2025-11-27');
      const result = addBusinessDays(thursday, 2);
      expect(result.toISOString().split('T')[0]).toBe('2025-12-01');
    });
  });

  describe('getWeekdayChar', () => {
    it('月曜日の曜日文字を取得', () => {
      const monday = new Date('2025-11-24');
      expect(getWeekdayChar(monday)).toBe('月');
    });

    it('火曜日の曜日文字を取得', () => {
      const tuesday = new Date('2025-11-25');
      expect(getWeekdayChar(tuesday)).toBe('火');
    });

    it('水曜日の曜日文字を取得', () => {
      const wednesday = new Date('2025-11-26');
      expect(getWeekdayChar(wednesday)).toBe('水');
    });

    it('木曜日の曜日文字を取得', () => {
      const thursday = new Date('2025-11-27');
      expect(getWeekdayChar(thursday)).toBe('木');
    });

    it('金曜日の曜日文字を取得', () => {
      const friday = new Date('2025-11-28');
      expect(getWeekdayChar(friday)).toBe('金');
    });

    it('土曜日の曜日文字を取得', () => {
      const saturday = new Date('2025-11-29');
      expect(getWeekdayChar(saturday)).toBe('土');
    });

    it('日曜日の曜日文字を取得', () => {
      const sunday = new Date('2025-11-30');
      expect(getWeekdayChar(sunday)).toBe('日');
    });
  });

  describe('getWeekdayNotation', () => {
    it('Day 1の曜日表記を取得（月曜開始）', () => {
      const monday = new Date('2025-11-24');
      expect(getWeekdayNotation(monday, 1)).toBe('（月）');
    });

    it('Day 1の曜日表記を取得（水曜開始）', () => {
      const wednesday = new Date('2025-11-26');
      expect(getWeekdayNotation(wednesday, 1)).toBe('（水）');
    });

    it('Day 2の曜日表記を取得（月曜開始）', () => {
      const monday = new Date('2025-11-24');
      expect(getWeekdayNotation(monday, 2)).toBe('（火）');
    });

    it('Day 5の曜日表記を取得（月曜開始）', () => {
      const monday = new Date('2025-11-24');
      expect(getWeekdayNotation(monday, 5)).toBe('（金）');
    });

    it('Day 6の曜日表記を取得（月曜開始、週末をまたぐ）', () => {
      const monday = new Date('2025-11-24');
      expect(getWeekdayNotation(monday, 6)).toBe('（月）');
    });
  });

  describe('getWeekdayRangeNotation', () => {
    it('同じ日の範囲は単一曜日', () => {
      const monday = new Date('2025-11-24');
      expect(getWeekdayRangeNotation(monday, 1, 1)).toBe('（月）');
    });

    it('連続2日間の範囲（月火）', () => {
      const monday = new Date('2025-11-24');
      expect(getWeekdayRangeNotation(monday, 1, 2)).toBe('（月火）');
    });

    it('連続5日間の範囲（月火水木金）', () => {
      const monday = new Date('2025-11-24');
      expect(getWeekdayRangeNotation(monday, 1, 5)).toBe('（月火水木金）');
    });

    it('週をまたぐ範囲', () => {
      const monday = new Date('2025-11-24');
      // Day 5 = 金, Day 6 = 月
      expect(getWeekdayRangeNotation(monday, 5, 7)).toBe('（金月火）');
    });

    it('水曜開始で3日間', () => {
      const wednesday = new Date('2025-11-26');
      expect(getWeekdayRangeNotation(wednesday, 1, 3)).toBe('（水木金）');
    });
  });

  describe('getWeekNumber', () => {
    it('Day 1-5は Week 1', () => {
      expect(getWeekNumber(1)).toBe(1);
      expect(getWeekNumber(5)).toBe(1);
    });

    it('Day 6-10は Week 2', () => {
      expect(getWeekNumber(6)).toBe(2);
      expect(getWeekNumber(10)).toBe(2);
    });

    it('Day 11-15は Week 3', () => {
      expect(getWeekNumber(11)).toBe(3);
      expect(getWeekNumber(15)).toBe(3);
    });
  });

  describe('ensureBusinessDay', () => {
    it('営業日はそのまま返す', () => {
      const monday = new Date('2025-11-24');
      const result = ensureBusinessDay(monday);
      expect(result.toISOString().split('T')[0]).toBe('2025-11-24');
    });

    it('土曜日は月曜日に進める', () => {
      const saturday = new Date('2025-11-29');
      const result = ensureBusinessDay(saturday);
      expect(result.toISOString().split('T')[0]).toBe('2025-12-01');
    });

    it('日曜日は月曜日に進める', () => {
      const sunday = new Date('2025-11-30');
      const result = ensureBusinessDay(sunday);
      expect(result.toISOString().split('T')[0]).toBe('2025-12-01');
    });
  });
});
