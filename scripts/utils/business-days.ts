/**
 * 営業日計算ユーティリティ
 *
 * 土日を除外した営業日の計算と曜日表記を提供
 */

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];

/**
 * 営業日かどうかを判定（土日を除外）
 * @param date 判定する日付
 * @returns 営業日ならtrue
 */
export function isBusinessDay(date: Date): boolean {
  const day = date.getDay();
  return day !== 0 && day !== 6; // 0=日曜, 6=土曜
}

/**
 * 指定した営業日数を加算した日付を取得
 * @param startDate 開始日
 * @param businessDays 加算する営業日数
 * @returns 加算後の日付
 */
export function addBusinessDays(startDate: Date, businessDays: number): Date {
  const result = new Date(startDate);
  let addedDays = 0;

  while (addedDays < businessDays) {
    result.setDate(result.getDate() + 1);
    if (isBusinessDay(result)) {
      addedDays++;
    }
  }

  return result;
}

/**
 * 日付から曜日文字を取得
 * @param date 日付
 * @returns 曜日文字（日、月、火、水、木、金、土）
 */
export function getWeekdayChar(date: Date): string {
  return WEEKDAYS[date.getDay()];
}

/**
 * 営業日番号から曜日表記を取得
 * @param startDate プロジェクト開始日
 * @param dayNumber 営業日番号（1から開始）
 * @returns 曜日表記（例: 「（月）」）
 */
export function getWeekdayNotation(startDate: Date, dayNumber: number): string {
  if (dayNumber === 1) {
    return `（${getWeekdayChar(startDate)}）`;
  }
  const targetDate = addBusinessDays(startDate, dayNumber - 1);
  return `（${getWeekdayChar(targetDate)}）`;
}

/**
 * 営業日範囲の曜日表記を取得
 * @param startDate プロジェクト開始日
 * @param fromDay 開始営業日番号
 * @param toDay 終了営業日番号
 * @returns 範囲の曜日表記（例: 「（月火水）」）
 */
export function getWeekdayRangeNotation(
  startDate: Date,
  fromDay: number,
  toDay: number,
): string {
  if (fromDay === toDay) {
    return getWeekdayNotation(startDate, fromDay);
  }

  // 範囲内のすべての営業日の曜日を収集
  const weekdays: string[] = [];

  for (let day = fromDay; day <= toDay; day++) {
    const targetDate =
      day === 1 ? startDate : addBusinessDays(startDate, day - 1);
    if (isBusinessDay(targetDate)) {
      const weekday = getWeekdayChar(targetDate);
      if (!weekdays.includes(weekday)) {
        weekdays.push(weekday);
      }
    }
  }

  return `（${weekdays.join('')}）`;
}

/**
 * 営業日番号から週番号を計算
 * @param dayNumber 営業日番号（1から開始）
 * @returns 週番号（1から開始）
 */
export function getWeekNumber(dayNumber: number): number {
  return Math.ceil(dayNumber / 5);
}

/**
 * 開始日が営業日でない場合、次の営業日を取得
 * @param date 日付
 * @returns 営業日
 */
export function ensureBusinessDay(date: Date): Date {
  const result = new Date(date);
  while (!isBusinessDay(result)) {
    result.setDate(result.getDate() + 1);
  }
  return result;
}
