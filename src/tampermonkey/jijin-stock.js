/**
 * A股交易时段工具类
 *
 * 功能：
 *   StockMarket.isTradingTime([now])          — 当前是否在交易时段
 *   StockMarket.isDataFresh(update, [now])    — 数据是否仍有效
 *   StockMarket.isHoliday(date)               — 是否为非交易日
 *   StockMarket.isTradingDay(date)            — 是否为交易日
 *   StockMarket.getPrevTradingDay(date)       — 上一个交易日
 *   StockMarket.startWatcher(cb, [interval])  — 交易时段心跳（自动启停）
 *   StockMarket.isSameDay(d1, d2)            — 判断两个日期是否为同一天
 *   StockMarket.getCurrentTradingDate([now]) — 获取当前应引用的交易日（yyyy-MM-dd）
 *
 * 节假日判断策略：
 *   1. 周末 → 直接判定
 *   2. 硬编码列表（2024-2025，兜底）
 *   3. timor.tech 免费 API（2026+，异步查询）
 *   4. API 失败 → 假定为交易日（宁可交易不放假）
 */
class StockMarket {

    /** @private 节假日缓存 Map<"YYYY-MM-DD", boolean> */
    static #cache = new Map();
  
    /** @private 硬编码节假日（仅覆盖已知年份，API 兜底未知年份） */
    static #HOLIDAYS = new Set([
      // 2024
      '2024-01-01',
      '2024-02-12','2024-02-13','2024-02-14','2024-02-15','2024-02-16',
      '2024-04-04','2024-04-05',
      '2024-05-01','2024-05-02','2024-05-03',
      '2024-06-10',
      '2024-09-15','2024-09-16','2024-09-17',
      '2024-10-01','2024-10-02','2024-10-03','2024-10-04','2024-10-07',
      // 2025
      '2025-01-01',
      '2025-01-28','2025-01-29','2025-01-30','2025-01-31',
      '2025-02-01','2025-02-02','2025-02-03','2025-02-04',
      '2025-04-04','2025-04-05','2025-04-06',
      '2025-05-01','2025-05-02','2025-05-03','2025-05-04','2025-05-05',
      '2025-05-31','2025-06-01','2025-06-02',
      '2025-10-01','2025-10-02','2025-10-03','2025-10-04',
      '2025-10-05','2025-10-06','2025-10-07','2025-10-08',
    ]);
  
    /**
     * 判断某天是否为 A 股非交易日（周末或法定节假日）。
     * @param {Date|string} date
     * @returns {Promise<boolean>} true=非交易日
     */
    static async isHoliday(date) {
      date = new Date(date);
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      const key = `${y}-${m}-${d}`;
  
      // 1. 周末
      if (date.getDay() === 0 || date.getDay() === 6) return true;
  
      // 2. 缓存命中
      if (this.#cache.has(key)) return this.#cache.get(key);
  
      // 3. 硬编码兜底
      if (this.#HOLIDAYS.has(key)) {
        this.#cache.set(key, true);
        return true;
      }
  
      // 4. 调 API
      try {
        const res = await fetch(`https://timor.tech/api/holiday/info/${key}`);
        const json = await res.json();
        const result = json.holiday?.holiday === true;
        this.#cache.set(key, result);
        return result;
      } catch {
        this.#cache.set(key, false);
        return false;
      }
    }
  
    /**
     * 判断当前时间是否在 A 股交易时段。
     * @param {Date|string} [now=new Date()]
     * @returns {Promise<boolean>}
     */
    static async isTradingTime(now) {
      now = now ? new Date(now) : new Date();
  
      if (await this.isHoliday(now)) return false;
  
      const t = now.getHours() * 100 + now.getMinutes();
      // 集合竞价 9:15-9:25 → 可委托
      // 连续竞价 9:30-11:30
      // 连续竞价 13:00-15:00
      return (t >= 915 && t <= 925) ||
             (t >= 930 && t <= 1130) ||
             (t >= 1300 && t <= 1500);
    }
  
    /**
     * 判断某天是否为交易日。
     * @param {Date|string} date
     * @returns {Promise<boolean>}
     */
    static async isTradingDay(date) {
      date = new Date(date);
      return !(await this.isHoliday(date));
    }
  
    /**
     * 获取上一个交易日。
     * @param {Date|string} date
     * @returns {Promise<Date>}
     */
    static async getPrevTradingDay(date) {
      date = new Date(date);
      date.setDate(date.getDate() - 1);
      while (!(await this.isTradingDay(date))) {
        date.setDate(date.getDate() - 1);
      }
      return date;
    }
  
    /**
     * 判断两个日期是否在同一天（仅比较年/月/日）。
     * @param {Date|string} d1
     * @param {Date|string} d2
     * @returns {boolean}
     */
    static isSameDay(d1, d2) {
      d1 = new Date(d1);
      d2 = new Date(d2);
      return d1.getFullYear() === d2.getFullYear() &&
             d1.getMonth() === d2.getMonth() &&
             d1.getDate() === d2.getDate();
    }
  
    /**
     * 判断数据是否仍为最新（基于更新时间）。
     *
     * 规则：
     *   正在交易       → 有效
     *   交易日         → 今日 update≤15:00 有效
     *   非交易日       → 上一交易日 update≤15:00 有效
     *
     * @param {Date|string} updateTime - 数据更新时间
     * @param {Date|string} [now=new Date()] - 当前时间
     * @returns {Promise<boolean>}
     */
    static async isDataFresh(updateTime, now) {
      now = now ? new Date(now) : new Date();
      updateTime = new Date(updateTime);
  
      const upMin = updateTime.getHours() * 100 + updateTime.getMinutes();
  
      // 正在交易 → 数据有效
      if (await this.isTradingTime(now)) return true;
  
      // 交易日 → 今天下午三点前的数据有效
      if (await this.isTradingDay(now)) {
        return this.isSameDay(updateTime, now) && upMin <= 1500;
      }
  
      // 非交易日 → 上一个交易日下午三点前的数据有效
      const prevDay = await this.getPrevTradingDay(now);
      return this.isSameDay(updateTime, prevDay) && upMin <= 1500;
    }
  
    /**
     * 获取当前应引用的交易日。
     *
     * 规则：
     *   交易日 09:30 前 → 上一个交易日
     *   交易日 09:30 后 → 当天
     *   非交易日       → 上一个交易日
     *
     * @param {Date|string} [now=new Date()]
     * @returns {Promise<string>} yyyy-MM-dd
     *
     * @example
     * await StockMarket.getCurrentTradingDate();           // "2025-04-11"
     * await StockMarket.getCurrentTradingDate('2025-04-12 08:00'); // 周六 → 上一交易日
     */
    static async getCurrentTradingDate(now) {
      now = now ? new Date(now) : new Date();
  
      if (!(await this.isTradingDay(now))) {
        // 非交易日 → 上一个交易日
        const prev = await this.getPrevTradingDay(now);
        return this._formatDate(prev);
      }
  
      // 交易日：09:30 前 → 上一个交易日，否则 → 当天
      if (now.getHours() * 100 + now.getMinutes() < 930) {
        const prev = await this.getPrevTradingDay(now);
        return this._formatDate(prev);
      }
  
      return this._formatDate(now);
    }
  
    /** @private 将 Date 格式化为 yyyy-MM-dd */
    static _formatDate(d) {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    }
  
    /**
     * 启动交易时段心跳监听。
     *
     * 自动跟随 A 股交易时段：
     *   交易时段 → 每隔 interval 调用一次 callback
     *   午休 / 收盘 → 暂停，等到下一段开盘自动恢复
     *
     * @param {Function} callback - 回调函数（支持 async）
     * @param {number} [intervalMs=30000] - 调用间隔（毫秒），默认 30 秒
     * @returns {Function} stop() - 调用此函数即可停止
     *
     * @example
     * const stop = StockMarket.startWatcher(() => {
     *   console.log('刷新数据…', new Date().toLocaleTimeString());
     * });
     * // 6 小时后停止
     * setTimeout(stop, 6 * 3600_000);
     */
    static startWatcher(callback, intervalMs = 30000) {
      let active = true;
  
      (async () => {
        while (active) {
          if (await StockMarket.isTradingTime()) {
            try { await callback(); } catch (err) { /* 吞掉防止中断心跳 */ }
            await StockMarket._sleep(intervalMs);
          } else {
            // 非交易时段，每 10 秒探测一次是否开盘
            await StockMarket._sleep(10000);
          }
        }
      })();
  
      return () => { active = false; };
    }
  
    /** @private */
    static _sleep(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    }
  }
  
  export default StockMarket;
  