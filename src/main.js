import {panel as insurancePanel, bind as bindInsurance} from './insurance-ppt.js';
import {panel as salesToolPanel, bind as bindSalesTool} from './sales-tool-legacy.js';
import {compareSchema} from './compare-schema.js';
const modules = {
  salestool: { icon: "✦", title: "傳承銷售工具", subtitle: "上傳計劃書，生成個案PPT", color: "gold" },
  matching: { icon: "◇", title: "會前準備", subtitle: "由客戶輪廓尋找已批准資料", color: "gold" },
  library: { icon: "▤", title: "產品資料", subtitle: "按產品類別查閱已批准資料", color: "wine" },
  compare: { icon: "⇄", title: "產品對比", subtitle: "選擇產品，清楚比較已提供資料", color: "teal" },
  meeting: { icon: "◎", title: "見客助手", subtitle: "3 分鐘整理會前準備", color: "teal" },
  ppt: { icon: "▣", title: "PPT 一鍵生成", subtitle: "生成可編輯演示文稿", color: "coral" },
  sop: { icon: "✓", title: "新人簽單 SOP", subtitle: "由入門到成交的學習路徑", color: "sage" },
  learning: { icon: "▶", title: "內部學習中心", subtitle: "課程影片與內部牌照研習資料", color: "plum" },
  question: { icon: "?", title: "問題助手", subtitle: "整理日常工作思路", color: "violet" },
  practice: { icon: "◌", title: "話術訓練", subtitle: "模擬客戶，練習應對", color: "amber" },
  market: { icon: "◈", title: "市場資訊", subtitle: "同業產品與市場參考資料", color: "blue" },
  promotion: { icon: "✧", title: "產品推廣", subtitle: "查閱產品推廣活動及優惠資料", color: "gold" },
  discontinued: { icon: "⌑", title: "停售產品", subtitle: "已停售產品的歷史參考資料", color: "ink" },
};

const marketInformationFiles = [
  ["中國人壽", "傳統壽險", "裕饒傳承儲蓄保險計劃 (資訊更新日期：2020年10月).pdf"], ["中國人壽", "醫療產品", "衛您健康醫療保險計劃 (資訊更新日期：2020年04月).pdf"],
  ["永明金融", "危疾產品", "永明危疾家康保 (資訊更新日期：2022年05月).pdf"], ["永明金融", "危疾產品", "萬家康尊尚保 及萬家康尊尚保 - 福寶保 (資訊更新日期：2025年11月).pdf"], ["永明金融", "醫療產品", "永明港健康醫療保 (資訊更新日期：2020年04月).pdf"],
  ["全美", "萬用壽險", "Universal Life 2 (資訊更新日期：2016年07月).pdf"], ["安盛", "危疾產品", "市場產品資訊速遞 – 主要危疾定義之市場比較 (資訊更新日期：2025年07月).pdf"], ["安盛", "投資連繫產品", "盛名 II 整付投資保險計劃 (資訊更新日期：2021年07月)", "盛名 II 整付投資保險計劃 (資訊更新日期：2021年07月).pdf"],
  ["安盛", "傳統壽險", "豐進儲蓄計劃 - 2年保費繳付期版本 (資訊更新日期：2021年02月).pdf"], ["安盛", "醫療產品", "真智安心醫療保障 (資訊更新日期：2026年05月).pdf"], ["安盛", "醫療產品", "臻尚環球 (資訊更新日期：2026年05月).pdf"], ["安盛", "醫療產品", "AXA 安盛智尊守慧醫療保障 (資訊更新日期：2026年05月).pdf"],
  ["宏利 (香港)", "危疾產品", "「守護無間危疾保」 及「守護無間危疾保 (保寶未來)」 (資訊更新日期：2022年08月).pdf"], ["宏利 (香港)", "危疾產品", "「守護無間危疾保」之保費比較 (2024年4月) (資訊更新日期：2024年04月).pdf"], ["宏利 (香港)", "危疾產品", "活耀人生危疾保2 及 活耀人生危疾保2(加強版) (資訊更新日期：2020年08月).pdf"], ["宏利 (香港)", "傳統壽險", "創富傳承保障計劃2 (資訊更新日期：2020年11月).pdf"], ["宏利 (香港)", "醫療產品", "宏利晉悅自願醫保靈活計劃 (資訊更新日期：2026年05月).pdf"],
  ["保柏", "醫療產品", "卓康健, 童康健, 互通保額 (資訊更新日期：2016年10月).pdf"], ["保柏", "醫療產品", "保柏自願醫保計劃 (資訊更新日期：2020年04月).pdf"], ["保柏", "醫療產品", "摰卓 (資訊更新日期：2021年06月).pdf"],
  ["保誠", "危疾產品", "「誠保一生」危疾保 & 「誠保一生」危疾保 - 摯愛寶 (資訊更新日期：2023年06月）.pdf"], ["保誠", "危疾產品", "「誠保一生」危疾保之保費比較 (2024年4月).pdf"], ["保誠", "危疾產品", "危疾加護保II (資訊更新日期：2020年07月).pdf"], ["保誠", "危疾產品", "危疾加護保III (資訊更新日期：2021年01月).pdf"], ["保誠", "危疾產品", "危疾首護保II (資訊更新日期：2021年06月).pdf"], ["保誠", "傳統壽險", "特級「雋陞」儲蓄保 障計劃 II (資訊更新日期：2020年07月).pdf"],
  ["恒生", "醫療產品", "摯尚醫療保障計劃 (資訊更新日期：2015年04月).pdf"], ["美國萬通", "醫療產品", "「稅」優惠醫療計劃 (資訊更新日期：2019年04月).pdf"], ["美國萬通", "醫療產品", "癌症全面保 (資訊更新日期：2016年09月).pdf"],
  ["富衛", "危疾產品", "危疾應援保及危疾應援保 - 童步守護 (資訊更新日期：2025年11月).pdf"], ["富衛", "投資連繫產品", "智非凡II (資訊更新日期：2015年08月).pdf"], ["富衛", "萬用壽險", "愛升息特選理財壽險計劃 (資訊更新日期：2016年09月).pdf"], ["富衛", "醫療產品", "尊衛您醫療計劃 (資訊更新日期：2021年04月).pdf"], ["富衛", "醫療產品", "智適簡自願醫療保險計劃 (資訊更新日期：2020年04月).pdf"], ["富衛", "醫療產品", "衛一 (資訊更新日期：2021年06月).pdf"],
  ["滙豐", "萬用壽險", "翡翠環球自選萬用壽險 (資訊更新日期：2016年07月).pdf"], ["滙豐", "萬用壽險", "駿富萬用壽險計劃 (資訊更新日期：2015年06月).pdf"],
];

const discontinuedFiles = [
  ["「充裕未來」計劃 (BP)", "產品簡報.pdf"], ["「充裕未來」計劃 (BP)", "showdoc.jsp.pdf"], ["「充裕未來」計劃 2 (BP2)", "產品簡報.pdf"], ["「充裕未來」計劃 2 (BP2)", "showdoc.jsp.pdf"], ["「充裕未來」計劃 3 (BP3)", "產品簡報.pdf"], ["「充裕未來」計劃 3 (BP3)", "showdoc.jsp.pdf"], ["「充裕未來•盈尚」(BPV)", "產品簡報.pdf"], ["「充裕未來•盈尚」(BPV)", "showdoc.jsp.pdf"], ["「盈御多元貨幣計劃」(GP)", "產品簡報.pdf"], ["「盈御多元貨幣計劃」(GP)", "showdoc.jsp.pdf"], ["「盈御多元貨幣計劃2」(GP2)", " 產品簡報.pdf"], ["「盈御多元貨幣計劃2」(GP2)", "showdoc.jsp.pdf"],
];

// 此順序依團隊提供的產品分類維護；新增資料時只可選用其中一項。
const productCategories = [
  "友扣稅",
  "AIA 健康系列",
  "定期壽險",
  "醫療",
  "危疾",
  "嚴重程度健康保障",
  "個人意外",
  "萬用壽險",
  "終身壽險 及 儲蓄壽險",
  "投資相連計劃",
  "傷殘",
  "個人財物保險",
];
const categoryFileCounts = {
  "友扣稅": 29,
  "AIA 健康系列": 124,
  "定期壽險": 5,
  "醫療": 185,
  "危疾": 28,
  "嚴重程度健康保障": 12,
  "個人意外": 23,
  "萬用壽險": 2,
  "終身壽險 及 儲蓄壽險": 58,
  "投資相連計劃": 16,
  "傷殘": 1,
  "個人財物保險": 1,
};
const taxProductFolderOrder = [
  "AIA延期年金計劃2 (ADAP2)",
  "AIA自願醫保標準計劃 (AVS) (基本計劃)",
  "IA 健康系列：AIA自願醫保尊耀計劃(AVPU)(附加契約)",
  "AIA 健康系列：AIA自願醫保靈活計劃(AVFR) (附加契約)",
  "AIA自願醫保睿選計劃(AVSW)(基本計劃)",
  "AIA自願醫保尊耀計劃(AVPU)(附加契約)",
  "AIA 健康系列：AIA自願醫保靈活計劃(AVF)(基本計劃)",
  "AIA自願醫保標準計劃 (AVSR) (附加契約)",
  "AIA 健康系列：AIA自願醫保尊耀計劃(AVPU)(基本計劃)",
  "AIA自願醫保靈活計劃(AVF)(基本計劃)",
  "AIA 健康系列：AIA自願醫保標準計劃 (AVSR) (附加契約)",
  "AIA自願醫保睿選計劃(AVSWR)(附加契約)",
  "AIA 健康系列：AIA自願醫保標準計劃 (AVS) (基本計劃)",
  "AIA 健康系列：AIA自願醫保睿選計劃 (AVSWR)(附加契約)",
  "AIA自願醫保尊耀計劃(AVPU)(基本計劃)",
  "AIA自願醫保靈活計劃(AVFR) (附加契約)",
  "AIA 健康系列：AIA自願醫保睿選計劃 (AVSW)(基本計劃)",
];
const healthProductFolders = [
  "[友扣稅] AIA 健康系列：AIA自願醫保睿選計劃(AIAV AVSW)(基本計劃)",
  "AIA 健康系列：「睿選」醫療計劃(AIAV SW) (基本計劃)",
  "AIA 健康系列：「睿選明珠」醫療計劃(AIAV SWP) (基本計劃)",
  "[友扣稅] AIA 健康系列：AIA自願醫保睿選計劃(AIAV AVSWR)(附加契約)",
  "AIA 健康系列：「睿選」醫療計劃(AIAV SWR) (附加契約)",
  "AIA 健康系列：「睿選明珠」醫療計劃(AIAV SWPR) (附加契約)",
  "AIA 健康系列：「簡緻•愛伴航」保險計劃 (AIAV EOYS)",
  "AIA 健康系列：「愛伴航」保險計劃2 (AIAV OYS2)",
  "AIA 健康系列：極臻•至尊醫療計劃 (AIAV OPCEO)",
  "AIA 健康系列：極臻•至尊明珠醫療計劃 (AIAV OPCEOP)",
  "AIA 健康系列：極臻•至尊醫療附加契約 (AIAV OPCEOR)",
  "AIA 健康系列：極臻•至尊明珠醫療附加契約 (AIAV OPCEOPR)",
  "[友扣稅] AIA 健康系列：AIA自願醫保尊耀計劃(AVPU)(基本計劃)",
  "AIA 健康系列：「大灣醫薈通」門診計劃 (AIAV GBAOP)(基本計劃)",
  "AIA 健康系列：「尊耀」醫療計劃(AIAV PU) (基本計劃) (只適用於澳門)",
  "AIA 健康系列：「尊耀明珠」醫療計劃(AIAV PUPR) (附加契約)",
  "AIA 健康系列：癌症全方位保障3 (AIAV CG3)",
  "AIA健康系列：癌症全方位明珠保障3 (AIAV CGP3)",
  "AIA健康系列：癌症全方位明珠保障附加契約3 (AIAV CGPR3)",
  "AIA健康系列：癌症全方位保障附加契約3 (AIA CGR3)",
  "AIA 健康系列：「全程守護健康保」(AIAV HJG)(基本計劃)",
  "AIA 健康系列：「全程守護健康保」(AIAV HJGR)(附加契約)",
  "AIA 健康系列：AIA 唯一摯保 - 全面保障附加契約 (AIAV AOAFPR)",
  "AIA 健康系列：AIA 唯一摯保 - 癌症及嚴重傳染病保障附加契約 (AIAV AOACSR)",
  "AIA 健康系列：AIA 唯一摯保明珠 - 全面保障附加契約 (AIAV AOAPFPR)",
  "AIA 健康系列：AIA 唯一摯保明珠 - 癌症及嚴重傳染病保障附加契約 (AIAV AOAPCSR)",
  "AIA 健康系列：AIA 唯一摯保 - 全面保障 (AIAV AOAFP)",
  "AIA 健康系列：AIA 唯一摯保明珠 - 全面保障 (AIAV AOAPFP)",
  "AIA 健康系列：簡護危疾保 (AIAV SCE)",
  "AIA 健康系列：簡護危疾明珠保 (AIAV SCEP)",
  "AIA 健康系列：簡護危疾明珠保附加契約 (AIAV SCEPR)",
  "AIA 健康系列：簡護危疾保附加契約 (AIAV SCER)",
  "AIA 健康系列：AIA 唯一摯保 - 癌症及嚴重傳染病保障 (AIAV AOACS)",
  "AIA 健康系列：AIA 唯一摯保明珠 - 癌症及嚴重傳染病保障 (AIAV AOAPCS)",
  "AIA 健康系列：嚴重疾病醫療保障附加契約 (AIAV SMR Rider)",
  "AIA 健康系列：嚴重疾病明珠醫療保障附加契約 (AIAV SPMR Rider)",
  "[友扣稅] AIA 健康系列：AIA自願醫保靈活計劃(AVF)(基本計劃)",
  "[友扣稅] AIA 健康系列：AIA自願醫保標準計劃 (AVS) (基本計劃)",
  "[友扣稅] AIA 健康系列：AIA自願醫保靈活計劃(AVFR) (附加契約)",
  "[友扣稅] AIA 健康系列：AIA自願醫保標準計劃 (AVSR) (附加契約)",
  "AIA 健康系列：「進添」計劃 - 癌症保障 (AIAV LUP)",
  "AIA 健康系列：「進添明珠」計劃 - 癌症保障 (AIAV LUPP)",
  "AIA 健康系列：「都市三保」醫療危疾保障計劃 (AIAV MT)",
  "AIA 健康系列：「都市三保明珠」醫療危疾保障計劃 (AIAV MTP)",
  "AIA 健康系列：「都市三保」醫療危疾保障附加契約 (AIAV MT Rider)",
  "AIA 健康系列：「都市三保明珠」醫療危疾保障附加契約 (AIAV MTP Rider)",
  "AIA 健康系列：尊誠定期壽險計劃 (Vitality Expert Term)",
  "AIA 健康系列：盛年意家保 (Vitality Super Adults Shield)",
  "AIA 健康系列：豐年意家保 (Vitality Super Seniors Shield)",
  "AIA 健康系列：摯誠定期壽險計劃 (Vitality Wisdom Term)",
  "AIA 健康系列：尊誠定期壽險附加契約 (Vitality Expert Term Rider)",
  "AIA 健康系列：摯誠定期壽險附加契約 (Vitality Wisdom Term Rider)",
  "AIA 健康系列：特級「健康之寶」醫療保障計劃2 (AIAV SGH2)",
  "AIA 健康系列：特級「健康之寶」2住院及手術賠償附加契約 (AIAV SGHR2)",
];
const healthProductFolderOrder = [
  "AIA 健康系列：「都市三保」醫療危疾保障計劃 (AIAV MT)",
  "AIA 健康系列：AIA 唯一摯保 - 全面保障 (AIAV AOAFP)",
  "[友扣稅] AIA 健康系列：AIA自願醫保靈活計劃(AVF)(基本計劃)",
  "[友扣稅] AIA 健康系列：AIA自願醫保標準計劃 (AVSR) (附加契約)",
  "AIA 健康系列：「全程守護健康保」(AIAV HJGR)(附加契約)",
  "AIA 健康系列：「簡緻•愛伴航」保險計劃 (AIAV EOYS)",
  "AIA 健康系列：「都市三保明珠」醫療危疾保障計劃 (AIAV MTP)",
  "AIA健康系列：癌症全方位明珠保障3 (AIAV CGP3)",
  "AIA 健康系列：「睿選」醫療計劃(AIAV SWR) (附加契約)",
  "AIA 健康系列：AIA 唯一摯保 - 癌症及嚴重傳染病保障附加契約 (AIAV AOACSR)",
  "AIA 健康系列：「全程守護健康保」(AIAV HJG)(基本計劃)",
  "[友扣稅] AIA 健康系列：AIA自願醫保靈活計劃(AVFR) (附加契約)",
  "[友扣稅] AIA 健康系列：AIA自願醫保睿選計劃(AIAV AVSW)(基本計劃)",
  "AIA健康系列：癌症全方位明珠保障附加契約3 (AIAV CGPR3)",
  "AIA 健康系列：簡護危疾保 (AIAV SCE)",
  "AIA 健康系列：AIA 唯一摯保 - 全面保障附加契約 (AIAV AOAFPR)",
  "AIA 健康系列：極臻•至尊醫療計劃 (AIAV OPCEO)",
  "AIA 健康系列：極臻•至尊明珠醫療計劃 (AIAV OPCEOP)",
  "AIA 健康系列：簡護危疾明珠保附加契約 (AIAV SCEPR)",
  "AIA 健康系列：「睿選明珠」醫療計劃(AIAV SWP) (基本計劃)",
  "AIA 健康系列：「進添明珠」計劃 - 癌症保障 (AIAV LUPP)",
  "AIA 健康系列：癌症全方位保障3 (AIAV CG3)",
  "AIA 健康系列：「尊耀明珠」醫療計劃(AIAV PUPR) (附加契約)",
  "AIA 健康系列：極臻•至尊醫療附加契約 (AIAV OPCEOR)",
  "AIA 健康系列：「愛伴航」保險計劃2 (AIAV OYS2)",
  "AIA 健康系列：特級「健康之寶」2住院及手術賠償附加契約 (AIAV SGHR2)",
  "AIA 健康系列：「睿選明珠」醫療計劃(AIAV SWPR) (附加契約)",
  "AIA 健康系列：「大灣醫薈通」門診計劃 (AIAV GBAOP)(基本計劃)",
  "AIA 健康系列：AIA 唯一摯保 - 癌症及嚴重傳染病保障 (AIAV AOACS)",
  "AIA 健康系列：嚴重疾病醫療保障附加契約 (AIAV SMR Rider)",
  "AIA 健康系列：盛年意家保 (Vitality Super Adults Shield)",
  "[友扣稅] AIA 健康系列：AIA自願醫保睿選計劃(AIAV AVSWR)(附加契約)",
  "AIA 健康系列：AIA 唯一摯保明珠 - 癌症及嚴重傳染病保障附加契約 (AIAV AOAPCSR)",
  "AIA 健康系列：AIA 唯一摯保明珠 - 全面保障 (AIAV AOAPFP)",
  "AIA 健康系列：尊誠定期壽險計劃 (Vitality Expert Term)",
  "AIA 健康系列：「都市三保」醫療危疾保障附加契約 (AIAV MT Rider)",
  "AIA 健康系列：簡護危疾保附加契約 (AIAV SCER)",
  "AIA 健康系列：簡護危疾明珠保 (AIAV SCEP)",
  "[友扣稅] AIA 健康系列：AIA自願醫保標準計劃 (AVS) (基本計劃)",
  "AIA 健康系列：「尊耀」醫療計劃(AIAV PU) (基本計劃) (只適用於澳門)",
  "AIA健康系列：癌症全方位保障附加契約3 (AIA CGR3)",
  "AIA 健康系列：尊誠定期壽險附加契約 (Vitality Expert Term Rider)",
  "AIA 健康系列：嚴重疾病明珠醫療保障附加契約 (AIAV SPMR Rider)",
  "AIA 健康系列：豐年意家保 (Vitality Super Seniors Shield)",
  "AIA 健康系列：特級「健康之寶」醫療保障計劃2 (AIAV SGH2)",
  "AIA 健康系列：AIA 唯一摯保明珠 - 全面保障附加契約 (AIAV AOAPFPR)",
  "AIA 健康系列：AIA 唯一摯保明珠 - 癌症及嚴重傳染病保障 (AIAV AOAPCS)",
  "AIA 健康系列：「都市三保明珠」醫療危疾保障附加契約 (AIAV MTP Rider)",
  "AIA 健康系列：「進添」計劃 - 癌症保障 (AIAV LUP)",
  "AIA 健康系列：摯誠定期壽險附加契約 (Vitality Wisdom Term Rider)",
  "AIA 健康系列：極臻•至尊明珠醫療附加契約 (AIAV OPCEOPR)",
  "AIA 健康系列：摯誠定期壽險計劃 (Vitality Wisdom Term)",
  "[友扣稅] AIA 健康系列：AIA自願醫保尊耀計劃(AVPU)(基本計劃)",
  "AIA 健康系列：「睿選」醫療計劃(AIAV SW) (基本計劃)",
];
const termProductFolders = [
  "摯誠定期壽險計劃 (Wisdom Term)",
  "尊誠定期壽險附加契約 (Expert Term Rider)",
  "尊誠定期壽險計劃 (Expert Term)",
  "摯誠定期壽險附加契約 (Wisdom Term Rider)",
  "守康易定期壽險計劃 (EGTL)",
];
const medicalProductFolders = [
  "極臻•至尊明珠醫療附加契約 (OPCEOPR)",
  "「尊耀明珠」醫療計劃 (PUPR) (附加契約)",
  "[僱員自選保障方案]「友心意」醫療保障計劃 2",
  "至尊明珠醫療計劃5 (CEOP5)",
  "「睿選」醫療計劃 (SWR) (附加契約)",
  "[友扣稅] AIA自願醫保靈活計劃(AVF)(基本計劃)",
  "「永無憂」住院及手術賠償附加契約(只適用於澳門)(HS80)",
  "「樂無憂」住院惠益附加契約 (HB)",
  "嚴重疾病明珠醫療保障附加契約 (SPMR)",
  "[友扣稅] AIA自願醫保尊耀計劃(AVPU)(基本計劃",
  "特級「健康之寶」2住院及手術賠償附加契約 (SGHR2)",
  "[友扣稅] AIA自願醫保睿選計劃(AVSW)(基本計劃)",
  "至尊明珠醫療5 附加契約 (CEOP5 Rider)",
  "「尊耀」醫療計劃 (PU) (附加契約) (只適用於澳門)",
  "「常伴您」保費退還住院現金保障 (ROPHC)",
  "極臻•至尊明珠醫療計劃 (OPCEOP)",
  "極臻•至尊明珠醫療計劃 — 首護摯寶 (OPCEOPFG)",
  "癌症全方位保障附加契約3 (CGR3)",
  "極臻•至尊醫療附加契約 (OPCEOR)",
  "特級「健康之寶」醫療保障計劃2 (SGH2)",
  "「全程守護健康保」(HJG)(基本計劃)",
  "[友扣稅] AIA自願醫保尊耀計劃(AVPU)(附加契約)",
  "癌症全方位明珠保障附加契約3 (CGPR3)",
  "極臻•至尊醫療計劃 (OPCEO)",
  "「常伴您」保費退還手術現金保障 (ROPSC)",
  "[友扣稅] AIA自願醫保標準計劃 (AVSR) (附加契約)",
  "「倍無憂」醫療保障計劃 (只適用於澳門)(IMP80)",
  "「睿選」醫療計劃 (SW) (基本計劃)",
  "極臻•至尊醫療計劃 — 首護摯寶 (OPCEOFG)",
  "至尊醫療5附加契約 (CEO5 Rider)",
  "「尊耀明珠」醫療計劃 (PUP) (基本計劃)",
  " [友扣稅] AIA自願醫保睿選計劃(AVSWR)(附加契約)",
  "「大灣醫薈通」門診附加契約 (GBAOPR)(附加契約)",
  "[友扣稅] AIA自願醫保靈活計劃(AVFR) (附加契約",
  "「都市三保明珠」醫療危疾保障計劃 (MTP)",
  "「都市三保明珠」醫療危疾保障附加契約 (MTP Rider)",
  "「睿選明珠」醫療計劃 (SWP) (基本計劃)",
  "「全程守護健康保」(HJGR)(附加契約)",
  "癌症全方位保障3 (CG3)",
  "[友扣稅] AIA自願醫保標準計劃 (AVS) (基本計劃)",
  "「睿選明珠」醫療計劃 (SWPR) (附加契約)",
  "「都市三保」醫療危疾保障附加契約 (MT Rider)",
  "「尊耀」醫療計劃 (PU) (基本計劃) (只適用於澳門)",
  "嚴重疾病醫療保障附加契約 (SMR)",
  "癌症全方位明珠保障3 (CGP3)",
  "靈活住院惠益保障計劃 (FLEXI-MG)",
  "「都市三保」醫療危疾保障計劃 (MT)",
  "至尊醫療計劃5 (CEO5)",
  "「大灣醫薈通」門診計劃 (GBAOP)(基本計劃)",
];
const criticalIllnessProductFolders = [
  "智護癌症保 (CCE)",
  "「愛伴航 – 首護摯寶」保險計劃2 (OYS2FG)",
  "危疾附加契約 (CI Rider Pro)",
  "進泰附加契約 (Prime Care Rider)",
  "[僱員自選保障方案]「友愛護」癌症保障計劃",
  "「摯愛您」保障計劃 (LCP)",
  "特級危疾豁免繳付保費附加契約 (WPCI Rider Pro)",
  "簡護危疾保 (SCE)",
  "「愛意」附加契約 (Pretty Choice Rider Pro)",
  "簡護危疾明珠保附加契約 (SCEPR)",
  "特級付款人保障連危疾附加契約 (PBCI Rider Pro)",
  "進添」保險計劃 - 癌症保障 (LUP)",
  "「愛伴航」保險計劃2 (OYS2)",
  "「進泰安心」危疾保險計劃2 (PCP2) (只適用於香港)",
  "「泰然安心」危疾保險計劃2 (ECP2) (只適用於香港)",
  "進升危疾保障計劃 (Super HealthGuard Pro)",
  "「自在自選」危疾保險計劃 (AA)",
  "簡護危疾明珠保 (SCEP)",
  "簡護危疾保附加契約 (SCER)",
  "特選危疾附加契約 (Enhanced CI Rider Pro)",
  "「進添明珠」保險計劃 - 癌症保障 (LUPP）",
  "「簡緻•愛伴航」保險計劃 (EOYS)",
  "「多重智倍」危疾保險計劃 (SEU) (只適用於香港)",
  "「多重安心」危疾保險計劃2 (MCP2) (只適用於香港)",
  "守康易危疾保(EGCE)",
];
const severityHealthProductFolders = [
  "AIA 唯一摯保 - 全面保障 (AOAFP)",
  "AIA 唯一摯保 - 全面保障附加契約 (AOAFPR)",
  "AIA 唯一摯保明珠 - 全面保障附加契約 (AOAPFPR)",
  "AIA 唯一摯保明珠 - 癌症及嚴重傳染病保障附加契約 (AOAPCS)",
  "AIA 唯一摯保明珠 - 全面保障 (AOAPFP)",
  "AIA 唯一摯保明珠 - 癌症及嚴重傳染病保障 (AOAPCS)",
  "AIA 唯一摯保 - 癌症及嚴重傳染病保障 (AOACS)",
  "AIA 唯一摯保 - 癌症及嚴重傳染病保障附加契約 (AOACSR)",
];
const personalAccidentProductFolders = [
  "伴您遨遊中國 (China Assist Protection)",
  "保費回贈 - 意外住院入息保障 (Premium Refund - Accidental HI)",
  "童年意家保 (SKS)",
  "醒目遊 (Travel Smart)",
  "豐年意家保 (SSS)",
  "盛年意家保 (SAS)",
  "「意安心升級保障」 (Secure First Plus)",
  "意外死亡賠償附加契約 : 意外死亡及斷肢附加契約 : 簡易意外死亡及斷肢附加契約",
  "「添意保」",
  "「競跑保」",
  "「常伴您」保費退還意外升級保障 (Here For You ROP PA Plus)",
  "意安心 (Secure First)",
  "自選人身意外保險3 (PAC Select 3)",
  "「銀意保」",
];
const universalLifeProductFolders = [
  "「財富雋永」人壽保險計劃2 (WU2)",
  "「財富相傳」人壽保險計劃5 (WP5)",
];
const wholeLifeSavingsProductFolders = [
  "「簡愛．延續」儲蓄保險計劃5 (SLE5)",
  "環宇盈活儲蓄保險計劃 (GF)",
  "「裕滿人生」保險計劃2 (AL2)",
  "分期支取儲蓄終身壽險連額外保障計劃 (LESAP)",
  "「諾享」儲蓄保險計劃2 (FP2)",
  "愛無憂長享儲蓄保險計劃5 (FLCP5)",
  "「愛伴航 – 首護摯寶」保險計劃2 (OYS2FG)",
  "有投必保儲蓄壽險計劃 (GIWL) (只適用於香港)",
  "「樂怡人生」保障計劃",
  "「財富顯裕」儲蓄保險計劃 (WER)",
  "「財富恆裕」人壽保險計劃3   (WE3)",
  "簡易特級高息保 (STSP)",
  "盈御多元貨幣儲蓄保險計劃3 (GP3)",
  "「財富源源」儲蓄保險計劃 (WG)",
  "「愛伴航」保險計劃2 (OYS2)",
  "「進泰安心」危疾保險計劃2 (PCP2) (只適用於香港)",
  "「泰然安心」危疾保險計劃2 (ECP2) (只適用於香港)",
  "「活然人生」保險計劃",
  "「自在自選」危疾保險計劃 (AA)",
  "「年金寶」入息計劃 (GYIP)",
  "「簡緻•愛伴航」保險計劃 (EOYS)",
  "「多重智倍」危疾保險計劃 (SEU) (只適用於香港)",
  "「多重安心」危疾保險計劃2 (MCP2) (只適用於香港)",
  "「樂怡人生」保障計劃 (週年紅利)",
  "「充裕未來」人壽保險計劃2 (特級保障) (BPEP2) (只適用於香港)",
  "「活出精彩」入息保險計劃 (SIP) (只適用於香港)",
  "額外購買權附加契約",
  "財富盈活儲蓄保險計劃 (WF)",
  "[友扣稅] AIA延期年金計劃2 (ADAP2)",
];
const investmentLinkedProductFolders = [
  "卓智投資計劃 2 (只適用於澳門)",
  "卓達智悅 2",
  "「您想」投資連繫壽險計劃 (只適用於澳門)",
  "AIA「兩全保」保障型投資相連壽險計劃（整付保費）: AIA「兩全保」保障型投資相連壽險計劃（定期保費）",
  "卓達智悅 (只適用於澳門)",
];
const disabilityProductFolders = ["特級預支保額及免付保費附加契約 (EAPWP)"];
const personalPropertyProductFolders = ["「競跑保」"];
const productDocuments = [
  product("AIA 健康系列：AIA自願醫保睿選計劃 (AVSW)(基本計劃)", "基本計劃", "2025-10", "AIA 健康系列：AIA自願醫保睿選計劃 (AVSW)(基本計劃)", ["保費表.pdf", "showdoc.jsp.pdf", "Care-Concierge-Service-pre-leaflet-tc.pdf"]),
  product("AIA自願醫保睿選計劃(AVSW)(基本計劃)", "基本計劃", "2025-10", "AIA自願醫保睿選計劃(AVSW)(基本計劃)", ["保費表.pdf", "showdoc.jsp.pdf", "Care-Concierge-Service-pre-leaflet-tc.pdf"]),
  product("AIA 健康系列：AIA自願醫保睿選計劃 (AVSWR)(附加契約)", "附加契約", "2025-10", "AIA 健康系列：AIA自願醫保睿選計劃 (AVSWR)(附加契約)", ["保費表.pdf", "showdoc.jsp.pdf", "Care-Concierge-Service-pre-leaflet-tc.pdf"]),
  product("AIA自願醫保睿選計劃(AVSWR)(附加契約)", "附加契約", "2025-10", "AIA自願醫保睿選計劃(AVSWR)(附加契約)", ["保費表.pdf", "showdoc.jsp.pdf", "Care-Concierge-Service-pre-leaflet-tc.pdf"]),
  product("AIA延期年金計劃 2 (ADAP2)", "基本計劃", "2025-02", "AIA延期年金計劃2 (ADAP2)", ["showdoc.jsp.pdf"]),
  product("AIA 健康系列：AIA自願醫保尊耀計劃(AVPU)(基本計劃)", "基本計劃", "2024-04", "AIA 健康系列：AIA自願醫保尊耀計劃(AVPU)(基本計劃)", ["保費表.pdf", "showdoc.jsp拷貝.pdf"]),
  product("AIA自願醫保尊耀計劃(AVPU)(基本計劃)", "基本計劃", "2024-04", "AIA自願醫保尊耀計劃(AVPU)(基本計劃)", ["保費表.pdf", "showdoc.jsp.pdf"]),
  product("AIA 健康系列：AIA自願醫保尊耀計劃(AVPU)(附加契約)", "附加契約", "2024-04", "IA 健康系列：AIA自願醫保尊耀計劃(AVPU)(附加契約)", ["保費表.pdf", "showdoc.jsp拷貝.pdf"]),
  product("AIA自願醫保尊耀計劃(AVPU)(附加契約)", "附加契約", "2024-04", "AIA自願醫保尊耀計劃(AVPU)(附加契約)", ["保費表.pdf", "showdoc.jsp.pdf"]),
  product("AIA 健康系列：AIA自願醫保靈活計劃(AVF)(基本計劃)", "基本計劃", "2019-04", "AIA 健康系列：AIA自願醫保靈活計劃(AVF)(基本計劃)", ["保費表.pdf"]),
  product("AIA 健康系列：AIA自願醫保標準計劃 (AVS)(基本計劃)", "基本計劃", "2019-04", "AIA 健康系列：AIA自願醫保標準計劃 (AVS) (基本計劃)", ["保費表.pdf"]),
  product("AIA自願醫保靈活計劃(AVF)(基本計劃)", "基本計劃", "2019-04", "AIA自願醫保靈活計劃(AVF)(基本計劃)", ["保費表.pdf"]),
  product("AIA自願醫保標準計劃 (AVS)(基本計劃)", "基本計劃", "2019-04", "AIA自願醫保標準計劃 (AVS) (基本計劃)", ["保費表.pdf"]),
  product("AIA 健康系列：AIA自願醫保靈活計劃(AVFR)(附加契約)", "附加契約", "2019-04", "AIA 健康系列：AIA自願醫保靈活計劃(AVFR) (附加契約)", ["保費表.pdf"]),
  product("AIA 健康系列：AIA自願醫保標準計劃 (AVSR)(附加契約)", "附加契約", "2019-04", "AIA 健康系列：AIA自願醫保標準計劃 (AVSR) (附加契約)", ["保費表.pdf"]),
  product("AIA自願醫保靈活計劃(AVFR)(附加契約)", "附加契約", "2019-04", "AIA自願醫保靈活計劃(AVFR) (附加契約)", ["保費表.pdf"]),
  product("AIA自願醫保標準計劃 (AVSR)(附加契約)", "附加契約", "2019-04", "AIA自願醫保標準計劃 (AVSR) (附加契約)", ["保費表.pdf"]),
  ...healthProductFolderOrder.map((folder) => folderProduct("AIA 健康系列", folder, "02_AIA健康系列")),
  ...termProductFolders.map((folder) => folderProduct("定期壽險", folder, "03_定期壽險")),
  ...medicalProductFolders.map((folder) => folderProduct("醫療", folder, "04_醫療")),
  ...criticalIllnessProductFolders.map((folder) => folderProduct("危疾", folder, "05_危疾")),
  ...severityHealthProductFolders.map((folder) => folderProduct("嚴重程度健康保障", folder, "06_嚴重程度健康保障")),
  ...personalAccidentProductFolders.map((folder) => folderProduct("個人意外", folder, "07_個人意外")),
  ...universalLifeProductFolders.map((folder) => folderProduct("萬用壽險", folder, "08_萬用壽險")),
  ...wholeLifeSavingsProductFolders.map((folder) => folderProduct("終身壽險 及 儲蓄壽險", folder, "09_終身壽險及儲蓄壽險")),
  ...investmentLinkedProductFolders.map((folder) => folderProduct("投資相連計劃", folder, "10_投資相連計劃")),
  ...disabilityProductFolders.map((folder) => folderProduct("傷殘", folder, "11_傷殘")),
  ...personalPropertyProductFolders.map((folder) => folderProduct("個人財物保險", folder, "12_個人財物保險")),
];

function product(title, planType, launched, folder, filenames) {
  return {
    category: "友扣稅",
    library: "01_友扣稅",
    sourceId: `01_友扣稅/${folder}`,
    title,
    planType,
    status: "現有產品",
    launched,
    folder,
    files: filenames.map((filename, index) => ({
      label: filename.includes("Care-Concierge") ? "服務宣傳單張" : index === 1 ? "產品資料（副本）" : "產品資料",
      href: `assets/library/01_友扣稅/${folder}/${filename}`,
      filename,
    })),
  };
}

function folderProduct(category, folder, library) {
  return {
    category,
    sourceId: `${library}/${folder}`,
    title: folder.replace(/^\[友扣稅\]\s*/, ""),
    planType: "已同步產品資料",
    status: "現有產品",
    launched: "",
    folder,
    library,
    files: [],
  };
}

let currentModule = "home";
let practiceTurn = 0;
let selectedLibraryCategory = null;
let comparisonProductIds = [];

function getUiTheme() {
  return localStorage.getItem("aia-ui-theme") || "slate";
}

function escapeHtml(value = "") {
  return String(value).replace(/[&<>'"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[c]));
}

function appShell(content) {
  const uiTheme = getUiTheme();
  return `<div class="app-shell">
    <aside class="sidebar">
      <div class="brand"><div class="brand-mark">A</div><div><strong>AI 工作台</strong><small>内部 MVP · 演示版</small></div></div>
      <nav>${navItem("home", "⌂", "首頁")}${navItem("salestool", "✦", "傳承銷售工具")}${navGroup("library", ["promotion", "market", "discontinued"])}${navItem("compare", "⇄", "產品對比")}${navGroup("meeting", ["matching", "question", "practice"])}${navItem("sop", "✓", "新人簽單 SOP")}${navItem("learning", "▶", "內部學習中心")}${navItem("cases", "＋", "個案紀錄")}${navItem("workflow", "▦", "流程採集表")}${navItem("ppt", "▣", "PPT 一鍵生成")}</nav>
      <div class="sidebar-footer"><span class="status-dot"></span>示範模式<br><small>請勿輸入客戶個人資料</small></div>
    </aside>
    <main class="main"><header class="topbar"><button id="menuButton" class="menu-button">☰</button><div class="notice">此為內部示範版 · 所有輸出均須人工覆核後使用</div><div class="theme-preview" style="display:flex" role="group" aria-label="配色預覽"><span class="theme-label">配色</span><button title="原始紅色系" class="theme-choice ${uiTheme === "classic-red" ? "active" : ""}" data-theme-choice="classic-red">經典紅</button><button title="經典藏藍－啞光金" class="theme-choice ${uiTheme === "navy-gold" ? "active" : ""}" data-theme-choice="navy-gold">藏藍金</button><button title="炭灰黑－暗酒紅－香檳金" class="theme-choice ${uiTheme === "guardian" ? "active" : ""}" data-theme-choice="guardian">炭灰紅</button><button title="現代 Slate 灰藍" class="theme-choice ${uiTheme === "slate" ? "active" : ""}" data-theme-choice="slate">Slate</button><button title="深色模式－黑金尊享" class="theme-choice ${uiTheme === "black-gold" ? "active" : ""}" data-theme-choice="black-gold">黑金</button></div><div class="avatar">演</div></header>${sectionNavigation()}${content}</main>
  </div>`;
}
function navItem(id, icon, label) { return `<button class="nav-item ${currentModule === id ? "active" : ""}" data-route="${id}"><span>${icon}</span>${label}</button>`; }
const moduleGroups = { library: ["promotion", "market", "discontinued"], meeting: ["matching", "question", "practice"] };
function navGroup(parent, children) {
  const m = modules[parent];
  return `<div class="nav-group" role="group" aria-label="${m.title}">${navItem(parent, m.icon, m.title)}<div class="nav-children">${children.map(id => navItem(id, modules[id].icon, modules[id].title)).join("")}</div></div>`;
}
function sectionNavigation() {
  const group = Object.entries(moduleGroups).find(([parent, children]) => [parent, ...children].includes(currentModule));
  if (!group) return "";
  const [parent, children] = group;
  return `<nav class="page section-navigation" aria-label="${modules[parent].title}功能">${[parent, ...children].map(id => `<button class="section-tab ${currentModule === id ? "active" : ""}" data-route="${id}" ${currentModule === id ? 'aria-current="page"' : ''}>${id === "meeting" ? "會面規劃" : modules[id].title}</button>`).join("")}</nav>`;
}
function formField(label, id, options, hint = "") { return `<label class="field"><span>${label}</span><select id="${id}">${options.map(x => `<option>${escapeHtml(x)}</option>`).join("")}</select>${hint ? `<small>${hint}</small>` : ""}</label>`; }
function textField(label, id, placeholder, rows = 3) { return `<label class="field"><span>${label}</span><textarea id="${id}" rows="${rows}" placeholder="${escapeHtml(placeholder)}"></textarea></label>`; }

function home() {
  return appShell(`<section class="page hero"><div><p class="eyebrow">CHOIX · AI WORKBENCH</p><h1>讓每一次會面準備<br>更有把握。</h1><p class="lead">由客戶輪廓出發，連結已批准的保障資料，<br>生成有根據、可覆核的工作草稿。</p><button class="hero-action" data-route="meeting">開啟見客助手 <span>→</span></button></div><div class="hero-badge">2026<br><small>智選工作台</small></div></section>
  <section class="page dashboard"><div class="section-title"><div><p class="eyebrow">快速開始</p><h2>今天想完成什麼？</h2></div><span class="live-label"><i></i> 已連接示範資料庫</span></div><div class="card-grid">${Object.entries(modules).filter(([id]) => !Object.values(moduleGroups).flat().includes(id)).map(([id, m]) => `<button class="module-card ${m.color}" data-route="${id}"><div class="module-icon">${m.icon}</div><h3>${m.title}</h3><p>${m.subtitle}</p><span>進入工作流程 <b>→</b></span></button>`).join("")}</div>
  <div class="principle-grid"><div><span>01</span><h3>資料有根據</h3><p>每項建議均應連結已批准文件、版本與頁碼。</p></div><div><span>02</span><h3>人員作最後判斷</h3><p>AI 提供草稿，不取代持牌人士或主管覆核。</p></div><div><span>03</span><h3>保障私隱</h3><p>只輸入概括、已脫敏的客戶輪廓，不輸入個人資料。</p></div></div></section>`);
}

function matching() {
 return appShell(`<section class="page page-heading"><p class="eyebrow">會前準備 · 示範版</p><h1>由客戶輪廓，找到<br>值得準備的資料。</h1><p>先描述客戶的生活階段與關注重點；系統只顯示已批准資料庫中的相關文件。</p></section><section class="page two-column match-layout"><div class="panel profile-panel"><div class="panel-kicker">客戶輪廓</div><h2>會面前的 60 秒準備</h2>${formField("人生階段", "profileStage", ["初入職場／年輕專業人士", "已婚或計劃成家", "有年幼子女的家庭", "事業穩定／準備退休"])}${formField("主要關注", "profileFocus", ["家庭保障與責任", "醫療保障準備", "長期儲蓄與退休", "現有保障檢視"])}${formField("預算取向", "profileBudget", ["希望先了解基本選項", "重視保障與預算平衡", "希望比較不同方案"])}${textField("補充背景（請勿輸入姓名或識別資料）", "profileNotes", "例如：家庭收入主要來源，希望先了解保障缺口", 3)}<button class="primary" id="matchPolicies">尋找相關資料 <span>→</span></button><p class="tiny">只使用概括及已脫敏的資料。</p></div><div class="panel output-panel policy-output" id="matchingOutput"><div class="empty-state"><div>◇</div><h3>準備好開始配對</h3><p>填寫左側輪廓後，這裡會展示相關資料及每一項的來源。</p></div></div></section>`);
}

function library() {
 const list = productCategories.map((category, index) => {
   const items = productDocuments.filter((document) => document.category === category);
   const fileCount = categoryFileCounts[category] ?? items.reduce((total, document) => total + document.files.length, 0);
   return `<button class="category-row ${selectedLibraryCategory === category ? "selected" : ""}" data-library-category="${escapeHtml(category)}"><span class="category-index">${String(index + 1).padStart(2, "0")}</span><span><b>${escapeHtml(category)}</b><small>${items.length ? `${items.length} 項產品，${fileCount} 份資料` : "等待加入產品資料"}</small></span><em class="category-count">${items.length}</em></button>`;
 }).join("");
 const selectedProducts = selectedLibraryCategory ? productDocuments.filter((document) => document.category === selectedLibraryCategory) : [];
 if (selectedLibraryCategory === "友扣稅") {
   const positions = new Map(taxProductFolderOrder.map((folder, index) => [folder, index]));
   selectedProducts.sort((a, b) => (positions.get(a.folder) ?? Infinity) - (positions.get(b.folder) ?? Infinity));
 }
 const products = selectedProducts.map((document, index) => {
   const meta = [document.planType, document.status, document.launched ? `推出日期 ${document.launched}` : ""].filter(Boolean).join(" · ");
   const files = document.library
     ? `<div class="record-files-list direct-file-list" data-product-folder="${escapeHtml(document.folder)}" data-library="${escapeHtml(document.library)}"><p>點開產品後載入可直接開啟的 PDF…</p></div>`
     : `<div class="record-files-list">${document.files.map((file) => `<a href="${encodeURI(file.href)}" target="_blank" rel="noreferrer"><span>${escapeHtml(file.label)}</span><small>${escapeHtml(file.filename)}</small><b>開啟 PDF ↗</b></a>`).join("")}</div>`;
   return `<details class="product-record"><summary><span class="record-index">${String(index + 1).padStart(2, "0")}</span><span class="record-name"><b>${escapeHtml(document.title)}</b><small>${escapeHtml(meta)}</small></span><span class="record-files">查看資料</span></summary>${files}</details>`;
 }).join("");
 const selectedIndex = productCategories.indexOf(selectedLibraryCategory) + 1;
 const chosenProducts = selectedProducts.length ? `<section class="page product-records"><div class="records-heading"><div><p class="eyebrow">${String(selectedIndex).padStart(2, "0")} · ${escapeHtml(selectedLibraryCategory)}</p><h2>產品資料清單</h2></div><span>${selectedProducts.length} 項產品，依指定次序排列</span></div><div class="product-list">${products}</div></section>` : "";
 const taxProducts = productDocuments.filter((document) => document.category === "友扣稅");
 return appShell(`<section class="page library-layout"><div class="library-note"><span>資料庫規則</span><p>資料庫只顯示本次同步的最新整理版本。點開產品後，可直接開啟對應 PDF。</p><small>已同步：友扣稅 ${taxProducts.length} 項產品／${categoryFileCounts["友扣稅"]} 份資料<br>AIA 健康系列 ${healthProductFolders.length} 項產品／${categoryFileCounts["AIA 健康系列"]} 份資料<br>定期壽險 ${termProductFolders.length} 項產品／${categoryFileCounts["定期壽險"]} 份資料<br>醫療 ${medicalProductFolders.length} 項產品／${categoryFileCounts["醫療"]} 份資料</small></div><div class="category-list">${list}</div></section>${chosenProducts}`);
}

function compare() {
 const selected = comparisonProductIds.map((id) => ({ id, product: productDocuments[Number(id)] })).filter(({ product }) => product);
 const options = productDocuments.map((product, index) => `<option value="${index}" ${comparisonProductIds.includes(String(index)) ? "disabled" : ""}>${escapeHtml(product.category)}｜${escapeHtml(product.title)}</option>`).join("");
 const selectedCards = selected.length ? selected.map(({ id, product }, index) => `<article class="compare-product"><span>${String(index + 1).padStart(2, "0")}</span><div><b>${escapeHtml(product.title)}</b><small>${escapeHtml(product.category)} · ${escapeHtml(product.planType || "資料暫未提供")}</small></div><button class="text-button" data-remove-compare="${id}">移除</button></article>`).join("") : `<div class="compare-empty">請從現有產品資料加入至少 2 項產品。</div>`;
 return appShell(`<section class="page page-heading"><p class="eyebrow">產品對比</p><h1>只比較已選產品，<br>清楚保留資料邊界。</h1><p>可選擇 2 至 4 項現有資料庫產品。未在已選資料中提供的內容，系統會標示為「資料暫未提供」。</p></section><section class="page compare-layout"><div class="panel compare-selector"><div class="panel-kicker">選擇產品</div><h2>建立對比組合</h2><label class="field"><span>現有產品資料產品</span><select id="compareProductSelect"><option value="">請選擇產品</option>${options}</select></label><button class="primary secondary" id="addCompareProduct" ${selected.length >= 4 ? "disabled" : ""}>加入對比產品</button><p class="tiny">已選 ${selected.length} / 4 項；至少選擇 2 項才可開始對比。</p><div class="compare-selected">${selectedCards}</div><button class="primary" id="startCompare" ${selected.length < 2 ? "disabled" : ""}>開始對比 <span>→</span></button></div><div class="panel output-panel compare-output" id="compareOutput"><div class="empty-state"><div>⇄</div><h3>選擇產品後開始</h3><p>只會讀取你加入的產品及其資料來源，不會讀取整個產品資料。</p></div></div></section>`);
}

function compareFieldsForProduct(product, useGeneric = false) {
 if (useGeneric) return compareSchema.generic?.fields || [];
 return Object.values(compareSchema.categories || {}).find((schema) => schema.categoryNames.includes(product.category))?.fields || compareSchema.generic?.fields || [];
}

function sourceLocation(product) {
 const [library, ...folderParts] = String(product.sourceId || "").split("/");
 if (library && folderParts.length) return { library, folder: folderParts.join("/") };
 return { library: product.library, folder: product.folder };
}

async function readSelectedProductData(products) {
 const useGeneric = new Set(products.map(({ product }) => product.category)).size > 1;
 return Promise.all(products.map(async ({ id, product }) => {
   const fields = compareFieldsForProduct(product, useGeneric);
   const source = sourceLocation(product);
   const query = new URLSearchParams({ library: source.library, folder: source.folder, fields: JSON.stringify(fields) });
   const response = await fetch(`/api/product-content?${query}`, { cache: "no-store" });
   if (!response.ok) throw new Error(`${product.title} 的資料讀取失敗（${response.status}）`);
   const content = await response.json();
   if (!content.productName || !Array.isArray(content.sourceFiles) || !content.fields) throw new Error(`${product.title} 的資料回應不完整，請重新啟動本機服務。`);
   return { id, title: product.title, category: product.category, planType: product.planType || "資料暫未提供", status: product.status || "資料暫未提供", launched: product.launched || "資料暫未提供", sourceFiles: content.sourceFiles, textRead: Boolean(content.textRead), extractedFields: content.fields, compareFields: fields };
 }));
}

function valueOrUnavailable(value) { return value || "資料暫未提供"; }

function fieldResults(product, field) {
 const results = product.extractedFields[field.key]?.results || [];
 return results.length ? results : [{ value: "資料暫未提供", evidence: "", source: "", found: false }];
}

function fieldValue(product, field) {
 const found = fieldResults(product, field).filter((result) => result.found);
 return found.length ? found.map((result) => result.value).join(" ／ ") : "資料暫未提供";
}

function toComparisonAiPayload(products) {
 return products.map((product) => ({
   id: product.id,
   title: product.title,
   category: product.category,
   sourceFiles: product.sourceFiles,
   fields: product.compareFields.map((field) => ({
     key: field.key,
     label: field.label,
     group: field.group,
     type: field.type,
     results: fieldResults(product, field).map(({ value, evidence, source, found }) => ({ value, evidence, source, found }))
   }))
 }));
}

function runComparisonAi(structuredProducts, schema) {
 const fieldMap = new Map();
 structuredProducts.forEach((product) => product.fields.forEach((field) => {
   if (!fieldMap.has(field.key)) fieldMap.set(field.key, { label: field.label, products: [] });
   fieldMap.get(field.key).products.push({ title: product.title, value: field.results.filter((item) => item.found).map((item) => item.value).join(" ／ ") || "資料暫未提供" });
 }));
 const coreDifferences = [...fieldMap.values()]
   .filter((field) => new Set(field.products.map((item) => item.value)).size > 1 && field.products.some((item) => item.value !== "資料暫未提供"))
   .slice(0, 5)
   .map((field) => `${field.label}：${field.products.map((item) => `${item.title}為「${item.value}」`).join("；")}`);
 const productFeatures = structuredProducts.map((product) => ({
   productId: product.id,
   highlights: product.fields.filter((field) => field.results.some((item) => item.found)).slice(0, 3)
     .map((field) => `${field.label}：${field.results.filter((item) => item.found).map((item) => item.value).join(" ／ ")}`)
 }));
 const missing = structuredProducts.flatMap((product) => product.fields.filter((field) => !field.results.some((item) => item.found)).map((field) => `${product.title}／${field.label}`));
 const mixedCategories = new Set(structuredProducts.map((product) => product.category)).size > 1;
 return {
   coreDifferences: coreDifferences.length ? coreDifferences : ["已提取欄位未顯示明確差異，或資料暫未提供。"],
   productFeatures,
   cautions: [
     ...(mixedCategories ? ["不同類別產品的保障目的不同，部分項目不適合直接橫向比較。"] : []),
     missing.length ? `以下欄位資料暫未提供：${missing.slice(0, 5).join("；")}${missing.length > 5 ? "等" : ""}。` : "所有已選 schema 欄位均有提取結果；仍請以正式文件為準。",
     "本比較只根據已提取的結構化資料，不判斷任何產品較佳。"
   ],
   summary: `已比較 ${structuredProducts.length} 項產品的已提取結構化欄位；未提供的資料均保留為「資料暫未提供」。`
 };
}

function buildCompareResult(products, schema, aiResult) {
 if (!schema?.instructions?.length) throw new Error("compare_schema 未載入");
 const definitions = [...new Map(products.flatMap((product) => product.compareFields.map((field) => [field.key, field])).entries()).values()]
   .sort((a, b) => a.priority - b.priority);
 const groups = [{ label: "基礎資料", rows: [
   { field: "產品名稱", values: Object.fromEntries(products.map((product) => [product.id, product.title])) },
   { field: "產品類別", values: Object.fromEntries(products.map((product) => [product.id, product.category])) },
   { field: "計劃／產品性質", values: Object.fromEntries(products.map((product) => [product.id, valueOrUnavailable(product.planType)])) },
   { field: "產品狀況", values: Object.fromEntries(products.map((product) => [product.id, valueOrUnavailable(product.status)])) },
   { field: "推出日期", values: Object.fromEntries(products.map((product) => [product.id, valueOrUnavailable(product.launched)])) }
 ] }];
 definitions.forEach((field) => {
   let group = groups.find((item) => item.label === field.group);
   if (!group) { group = { label: field.group, rows: [] }; groups.push(group); }
   group.rows.push({ field: field.label, values: Object.fromEntries(products.map((product) => [product.id, fieldValue(product, field)])) });
 });
 const groupOrder = schema.comparisonRules?.dimensionOrder || [];
 groups.sort((a, b) => {
   const left = groupOrder.indexOf(a.label), right = groupOrder.indexOf(b.label);
   return (left < 0 ? Number.MAX_SAFE_INTEGER : left) - (right < 0 ? Number.MAX_SAFE_INTEGER : right);
 });
 return { groups, ...aiResult };
}

function renderCompareResult(result, products) {
 const productById = new Map(products.map((product) => [product.id, product]));
 const table = (groups) => `<div class="compare-table-wrap"><table class="compare-table"><thead><tr><th>比較項目</th>${products.map((product) => `<th>${escapeHtml(product.title)}</th>`).join("")}</tr></thead><tbody>${groups.map((group) => `<tr><th colspan="${products.length + 1}">${escapeHtml(group.label)}</th></tr>${group.rows.map((row) => `<tr><td>${escapeHtml(row.field)}</td>${products.map((product) => `<td>${escapeHtml(valueOrUnavailable(row.values[product.id]))}</td>`).join("")}</tr>`).join("")}`).join("")}</tbody></table></div>`;
 return `<div class="result"><span class="tag">已按 compare_schema 產生</span><h2>產品對比結果</h2><h3>核心差異</h3><ul>${result.coreDifferences.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul><h3>產品橫向對比表</h3>${table(result.groups)}<h3>各產品特色</h3><div class="compare-highlights">${result.productFeatures.map((item) => `<article><b>${escapeHtml(productById.get(item.productId)?.title || "資料暫未提供")}</b><ul>${item.highlights.length ? item.highlights.map((highlight) => `<li>${escapeHtml(highlight)}</li>`).join("") : "<li>資料暫未提供</li>"}</ul></article>`).join("")}</div><h3>注意事項</h3><ul>${result.cautions.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul><h3>總結</h3><p>${escapeHtml(result.summary)}</p><h3>資料來源</h3><ul>${products.map((product) => `<li><b>${escapeHtml(product.title)}</b>：${escapeHtml(product.sourceFiles.length ? product.sourceFiles.join("、") : "資料暫未提供")}</li>`).join("")}</ul></div>`;
}

async function startProductComparison() {
 const output = document.querySelector("#compareOutput");
 const selected = comparisonProductIds.map((id) => ({ id, product: productDocuments[Number(id)] })).filter(({ product }) => product);
 if (selected.length < 2 || selected.length > 4) return;
 output.innerHTML = `<div class="empty-state"><div>⋯</div><h3>正在讀取已選產品資料</h3><p>只讀取 ${selected.length} 項產品的資料來源。</p></div>`;
 try {
   const products = await readSelectedProductData(selected);
   // The summary layer receives only selected schema fields, their evidence and source files.
   const aiResult = runComparisonAi(toComparisonAiPayload(products), compareSchema);
   const result = buildCompareResult(products, compareSchema, aiResult);
   output.innerHTML = renderCompareResult(result, products);
 } catch (error) {
   output.innerHTML = `<div class="empty-state"><div>!</div><h3>未能讀取產品資料</h3><p>${escapeHtml(error.message)} 請重新啟動本機服務後再試。</p></div>`;
 }
}

function fileLink(root, parts) {
  const href = [...root.split("/"), ...parts].map(encodeURIComponent).join("/");
  return `<a class="catalog-file" href="${href}" target="_blank" rel="noreferrer"><span>PDF</span><b>${escapeHtml(parts.at(-1))}</b><em>開啟 ↗</em></a>`;
}

const promotionFiles = [
  "260701-260930「財富恆裕2」壽險計劃專屬優惠.pdf",
  "260801 -260930 A260803「財富源源」儲蓄保險計劃限時推廣優惠.pdf",
  "260801-260930「財富源源」儲蓄保險計劃限時推廣優惠.pdf",
  "260901-260930 A260902 AIA 讓愛守護推廣活動 (2026年9月份).pdf",
  "260901-260930 A260904 預繳保費保證優惠息率推廣優惠 (2026年9月份).pdf",
  "260901-261231 核保部限時推廣活動2026 ─ 「活然人生」保險計劃.pdf"
];
function promotion() {
 return appShell(`<section class="page page-heading"><p class="eyebrow">產品資料</p><h1>產品推廣</h1><p>共 ${promotionFiles.length} 份推廣資料，點選即可開啟原始文件。</p></section><section class="page catalog-grid"><section class="catalog-group"><div><span>推廣活動</span><h2>產品優惠及推廣文件</h2><small>${promotionFiles.length} 份 PDF</small></div><div class="catalog-files">${promotionFiles.map(filename => fileLink("assets/promotion", [filename])).join("")}</div></section></section>`);
}

function market() {
  const groups = new Map();
  marketInformationFiles.forEach((entry) => {
    const [company, type, ...path] = entry;
    const key = `${company}｜${type}`;
    if (!groups.has(key)) groups.set(key, { company, type, files: [] });
    groups.get(key).files.push(path);
  });
  const sections = [...groups.values()].map(({ company, type, files }) => `<section class="catalog-group"><div><span>${escapeHtml(company)}</span><h2>${escapeHtml(type)}</h2><small>${files.length} 份資料</small></div><div class="catalog-files">${files.map((path) => fileLink("assets/market-info", [company, type, ...path])).join("")}</div></section>`).join("");
  return appShell(`<section class="page page-heading"><p class="eyebrow">市場資訊</p><h1>同業資料，<br>集中作市場參考。</h1><p>共 ${marketInformationFiles.length} 份資料，保留原有公司、產品類別、檔名及資料更新日期。</p></section><section class="page catalog-notice"><b>使用範圍</b><span>只供內部市場研究及培訓參考，不可視作產品建議、銷售文件或最新條款。使用前請自行核實資料日期與來源。</span></section><section class="page catalog-grid">${sections}</section>`);
}

function discontinued() {
  const groups = new Map();
  discontinuedFiles.forEach(([product, filename]) => {
    if (!groups.has(product)) groups.set(product, []);
    groups.get(product).push(filename);
  });
  const sections = [...groups.entries()].map(([product, files]) => `<section class="catalog-group discontinued-group"><div><span>已停售</span><h2>${escapeHtml(product)}</h2><small>${files.length} 份歷史資料</small></div><div class="catalog-files">${files.map((filename) => fileLink("assets/discontinued", [product, filename])).join("")}</div></section>`).join("");
  return appShell(`<section class="page page-heading"><p class="eyebrow">停售產品</p><h1>歷史產品資料，<br>清楚標示、獨立存放。</h1><p>共 ${discontinuedFiles.length} 份資料；所有檔案僅供查閱已停售產品的歷史內容。</p></section><section class="page catalog-notice discontinued-notice"><b>停售提示</b><span>此區資料不可用於新投保、對客推薦或取代現行已批准文件。如涉及現有保單，請依公司當時正式服務流程處理。</span></section><section class="page catalog-grid discontinued-grid">${sections}</section>`);
}

function meeting() {
 return appShell(`<section class="page page-heading"><p class="eyebrow">見客助手</p><h1>整理一次更有準備的會面</h1><p>填寫基本場景，生成會前準備與溝通框架。</p></section><section class="page two-column"><div class="panel"><h2>會面資料</h2>${formField("客戶階段", "clientStage", ["首次接觸", "已有客戶保障檢視", "家庭保障討論", "退休規劃討論"])}${formField("客戶類型", "clientType", ["年輕專業人士", "已婚／計劃成家", "有子女家庭", "中小企業主"])}${formField("會面目的", "meetingGoal", ["了解保障需要", "建立信任與需求探索", "年度保障檢視", "討論保障缺口"])}${textField("已知背景（請勿輸入個人資料）", "meetingNotes", "例如：重視家庭保障，希望先了解基本概念")}<button class="primary" id="generateMeeting">生成會前準備 <span>→</span></button></div><div class="panel output-panel" id="meetingOutput"><div class="empty-state"><div>◎</div><h3>準備開始</h3><p>填寫左側資料後，系統會生成一份可編輯的會面草稿。</p></div></div></section>`);
}

const sopSteps = [
  ["入門準備", "認識團隊規範、持牌要求、平台及產品資料庫。", "完成公司指定培訓；了解可使用及不可使用的資料。"],
  ["客源開發", "建立合規的客源來源與首次聯絡節奏。", "選擇客源來源；準備首次聯絡話術；記錄聯絡結果。"],
  ["客戶輪廓", "用不含敏感資料的方式了解生活階段、家庭責任與關注。", "在「會前準備」填寫概括輪廓；列出三個要了解的問題。"],
  ["需求分析", "了解客戶想解決的問題、保障缺口、預算與優先次序。", "整理需求及重點；先確認需要，再談方案。"],
  ["方案準備", "以已批准資料整理可討論的方向，不預設成交。", "從資料庫選擇文件；用「見客助手」準備提問；按需要生成 PPT 草稿。"],
  ["首次見客", "建立信任、聆聽需要、總結理解並約定下一步。", "使用開場與提問框架；會後立即記錄客戶關注及下一步。"],
  ["跟進與異議", "針對客戶真正關心的問題進行清楚、可覆核的跟進。", "記錄異議；查閱正式資料；需要時與主管覆核；安排下次聯絡。"],
  ["申請與核保", "按公司正式流程準備申請資料及處理核保要求。", "以公司最新清單核對文件；不承諾核保結果；紀錄進度。"],
  ["成交後服務", "完成保單交付、解釋後續服務及安排檢視。", "確認交付；設定年度檢視；留下服務提醒。"],
  ["復盤成長", "把每個個案轉化為下一次更好的準備。", "完成個案復盤；標記需要主管協助的問題；練習相關話術。"],
];
const sopShortcuts = {
  2: [["matching", "開啟會前準備"]],
  4: [["library", "開啟產品資料"], ["meeting", "開啟見客助手"], ["ppt", "開啟 PPT 一鍵生成"]],
  9: [["practice", "開啟話術訓練"]],
};

function sop() {
 const completed = new Set(JSON.parse(localStorage.getItem("aia-sop-completed") || "[]"));
 const steps = sopSteps.map(([title, purpose, action], index) => {
   const shortcuts = (sopShortcuts[index] || []).map(([route, label]) => `<button class="sop-shortcut" data-route="${route}">${label} <b>→</b></button>`).join("");
   return `<article class="sop-step ${completed.has(index) ? "done" : ""}"><div class="sop-number">${String(index + 1).padStart(2, "0")}</div><div><div class="sop-step-top"><div><h2>${escapeHtml(title)}</h2><p>${escapeHtml(purpose)}</p></div><label class="sop-check"><input type="checkbox" data-sop-step="${index}" ${completed.has(index) ? "checked" : ""}> <span>已完成</span></label></div><div class="sop-action"><b>這一步要做</b><span>${escapeHtml(action)}</span></div>${shortcuts ? `<div class="sop-shortcuts">${shortcuts}</div>` : ""}</div></article>`;
 }).join("");
 return appShell(`<section class="page page-heading"><p class="eyebrow">新人簽單 SOP</p><h1>由第一天開始，<br>走好每一次成交流程。</h1><p>這是一份新人學習路徑：先理解客戶需要，再準備方案、跟進與服務。每完成一步，可在右側勾選。</p></section><section class="page sop-reference"><div><span>學習參考</span><h2>保險銷售循環流程圖</h2><p>先閱讀完整銷售循環，再依下方 10 個步驟開始學習及實踐。</p></div><figure class="sop-reference-image"><img src="assets/training/sales/保險銷售循環流程圖_繁體.png?v=20260921-demand-analysis" alt="新人保險簽單銷售循環 SOP：尋找客戶、接洽約見、會面架構、需求分析、方案說明、顧慮與成交、申請與售後"></figure></section><section class="page sop-summary"><div><span class="tag">${completed.size} / ${sopSteps.length} 已完成</span><h2>從 0 到成交的 10 個步驟</h2></div><button class="text-button" id="resetSop">重設學習進度</button></section><section class="page sop-list">${steps}</section><section class="page sop-footer"><p><b>使用提示：</b>每个有工具协助的步骤下方，均已放上可直接点击的快捷按钮。</p></section>`);
}

const ilasMaterials = [
  ["01", "AIA「兩全保」保障型投資相連壽險計劃(整付保費)培訓資料.pdf", "內部學習資料", "assets/training/ilas/AIA「兩全保」保障型投資相連壽險計劃(整付保費)培訓資料.pdf", "必讀"],
  ["02", "AIA「兩全保」保障型投資相連壽險計劃(整付保費)產品研習資料 PRODUCT STUDY MATERIALS.pdf", "內部學習資料", "assets/training/ilas/AIA「兩全保」保障型投資相連壽險計劃(整付保費)產品研習資料 PRODUCT STUDY MATERIALS.pdf", "必讀"],
  ["03", "保障型投資相連壽險概念簡介.pdf", "內部學習資料", "assets/training/ilas/保障型投資相連壽險概念簡介.pdf", "參考"],
  ["04", "保障型投資相連壽險概念簡介閃卡.pdf", "內部學習資料", "assets/training/ilas/保障型投資相連壽險概念簡介閃卡.pdf", "溫習"],
  ["05", "AIA 2-IN-1 PROTECTION LINKED PLAN (SINGLE PREMIUM) ONLINE TRAINING (COMPULSORY) TRAINING DECK.pdf", "內部學習資料", "assets/training/ilas/AIA 2-IN-1 PROTECTION LINKED PLAN (SINGLE PREMIUM) ONLINE TRAINING (COMPULSORY) TRAINING DECK.pdf", "補充"],
  ["06", "AIA「两全保」保障型投资相连寿险计划(整付保费)培训资料.pdf", "內部學習資料", "assets/training/ilas/AIA「两全保」保障型投资相连寿险计划(整付保费)培训资料.pdf", "補充"],
  ["07", "保障型投资寿险相连概念简介.pdf", "內部學習資料", "assets/training/ilas/保障型投资寿险相连概念简介.pdf", "補充"],
];

const underwritingMaterials = [
  ["01", "核保指引.pdf"],
  ["02", "核保原理.pdf"],
  ["03", "核保指引 附錄1 - 打擊洗錢修例指引之營運規定.pdf"],
  ["04", "核保指引 附錄2 - 財政核保要求.pdf"],
  ["05", "核保指引 附錄3 - 非體檢優惠限額及例行體檢要求及保證繕發和簡易核保限額.pdf"],
  ["06", "核保指引 附錄4 - 國籍居留評級表.pdf"],
  ["07", "核保指引 附錄5 - 公司要員保險要求.pdf"],
  ["08", "核保指引 附錄6 - 可保利益聲明.pdf"],
];

function learning() {
 const materials = ilasMaterials.map(([number, title, description, href, label]) => `<a class="learning-material" href="${encodeURI(href)}" target="_blank" rel="noreferrer"><span class="material-number">${number}</span><span class="material-file">▤</span><div><b>${title}</b><small>${description}</small></div><i>${label}</i><em>開啟 <strong>↗</strong></em></a>`).join("");
 const underwriting = underwritingMaterials.map(([number, title]) => { const href = `assets/training/underwriting/${title}`; return `<a class="learning-material" href="${encodeURI(href)}" target="_blank" rel="noreferrer"><span class="material-number">${number}</span><span class="material-file">▤</span><div><b>${title}</b><small>內部核保參考資料</small></div><em>開啟 <strong>↗</strong></em></a>`; }).join("");
 return appShell(`<section class="page learning-hero"><div><p class="eyebrow">內部學習中心 · ILAS</p><h1>把複雜知識，<br>學得更有次序。</h1><p>ILAS 內部課程與研習資料</p></div><div class="learning-hero-stats"><div><b>01</b><span>必修影片</span></div><div><b>02</b><span>研習資料</span></div><div><b>03</b><span>學習階段</span></div></div></section><section class="page learning-warning"><b>內部培訓材料</b><span>此區只供內部培訓及牌照研習使用，不可轉發客戶或第三方。產品狀態、版本及可對客使用資料，均須以公司最新正式批准文件為準。</span></section><section class="page learning-path"><span>01</span><div><b>觀看必修影片</b><small>先建立產品全貌</small></div><i>→</i><span>02</span><div><b>閱讀核心教材</b><small>掌握牌照與概念重點</small></div><i>→</i><span>03</span><div><b>用記憶卡溫習</b><small>準備下一輪學習</small></div></section><section class="page learning-layout"><div class="learning-course"><div class="course-top"><div><div class="course-label">STEP 01 · 必修課程</div><h2>課程影片</h2><p>先看影片了解內容結構，再進入下方研習資料。</p></div><span class="course-duration">影片學習</span></div><h3 class="course-product-title">投資相連壽險 ILAS｜AIA「兩全保」保障型投資相連壽險計劃（整付保費）</h3><video controls preload="metadata" class="course-video"><source src="assets/training/ilas/ilas-required-course.mov" type="video/quicktime">你的瀏覽器未能直接播放此影片。</video><a class="video-fallback" href="assets/training/ilas/ilas-required-course.mov" target="_blank" rel="noreferrer">未能播放？在新視窗開啟影片 ↗</a></div><div class="learning-list"><div class="learning-list-heading"><div><div class="panel-kicker">STEP 02–03 · 課程資料</div><h2>依次閱讀與溫習</h2></div><span>7 份資料</span></div>${materials}</div></section><section class="page learning-list underwriting-library"><div class="learning-list-heading"><div><div class="panel-kicker">補充資料 · 核保</div><h2>核保指引</h2><p>點選檔案可直接開啟。只供內部參考，實際申請請以公司當時正式流程及最新文件為準。</p></div><span>8 份資料</span></div>${underwriting}</section><section class="page learning-next"><b>完成後下一步</b><span>完成內部研習後，回到「新人簽單 SOP」了解何時使用資料庫與見客助手；實際對客前，仍須以已批准的對客文件及主管指引為準。</span><button class="primary secondary" data-route="sop">返回新人簽單 SOP <span>→</span></button></section>`);
}

function ppt() { return appShell(insurancePanel()+`<section class="page panel"><details><summary>通用演示大綱（保留原功能）</summary>${textField("主題", "pptTopic", "例如：家庭保障規劃入門", 2)}${formField("頁數", "pptSlides", ["5 頁精簡版", "7 頁標準版", "10 頁詳細版"])}<button class="primary" id="generatePpt">生成 PPT 大綱 ✦</button><div id="pptOutput"></div></details></section>`); }
function salestool() { return appShell(salesToolPanel()); }

function question() {
 return appShell(`<section class="page page-heading"><p class="eyebrow">問題助手</p><h1>把問題變成下一步行動</h1><p>適合整理工作思路、草擬文案和拆分任務。</p></section><section class="page single"><div class="panel"><h2>你想解決什麼問題？</h2>${textField("問題描述", "userQuestion", "例如：怎樣為新人安排一場 30 分鐘的產品培訓？", 5)}<div class="quick-prompts"><button data-question="幫我擬一封會議後的跟進電郵">跟進電郵</button><button data-question="幫我把一個複雜工作任務拆成行動步驟">拆分任務</button><button data-question="幫我整理一場培訓的議程">培訓議程</button></div><button class="primary" id="askQuestion">整理建議 ✦</button></div><div class="panel answer-box" id="questionOutput"><div class="empty-state"><div>?</div><h3>從一個問題開始</h3><p>輸出僅作工作草稿；涉及條款、監管或客戶決定，請查閱正式文件並諮詢主管。</p></div></div></section>`);
}

function practice() {
 return appShell(`<section class="page page-heading"><p class="eyebrow">話術訓練</p><h1>先在這裡練習，再走進會面</h1><p>AI 會模擬一位客戶；完成後獲得覆盤建議。</p></section><section class="page two-column"><div class="panel"><h2>設定練習</h2>${formField("客戶角色", "persona", ["剛成家的年輕父母", "價格敏感的年輕專業人士", "已有保障、但猶豫是否檢視的客戶"])}${formField("練習場景", "scenario", ["首次約見", "了解需求", "處理預算異議", "保障檢視開場"])}${formField("難度", "difficulty", ["基礎", "普通", "挑戰"])}<button class="primary" id="startPractice">開始模擬對話 →</button><p class="tiny">示範版為文字練習，不代表銷售建議。</p></div><div class="panel chat-panel" id="practiceOutput"><div class="empty-state"><div>◌</div><h3>選擇情境後開始</h3><p>系統會先扮演客戶提出第一句回應。</p></div></div></section>`);
}

function render() {
 document.documentElement.dataset.theme = getUiTheme();
 const page = { home, salestool, matching, library, compare, market, promotion, discontinued, meeting, sop, learning, cases, workflow, ppt, question, practice }[currentModule]();
 document.querySelector("#app").innerHTML = page;
 document.querySelectorAll("[data-route]").forEach(el => el.addEventListener("click", () => { currentModule = el.dataset.route; render(); }));
 document.querySelectorAll("[data-theme-choice]").forEach((button) => button.addEventListener("click", () => {
   localStorage.setItem("aia-ui-theme", button.dataset.themeChoice);
   render();
 }));
 document.querySelector("#menuButton").addEventListener("click", () => document.querySelector(".sidebar").classList.toggle("open"));
 bindPage();
}

function bindPage() {
 bindInsurance();
 bindSalesTool();
 document.querySelector("#generateMeeting")?.addEventListener("click", generateMeeting);
 document.querySelector("#matchPolicies")?.addEventListener("click", matchPolicies);
 document.querySelector("#generatePpt")?.addEventListener("click", generatePptOutline);
 document.querySelector("#askQuestion")?.addEventListener("click", answerQuestion);
 document.querySelectorAll("[data-question]").forEach(b => b.addEventListener("click", () => { document.querySelector("#userQuestion").value = b.dataset.question; }));
 document.querySelector("#startPractice")?.addEventListener("click", startPractice);
 document.querySelectorAll("[data-sop-step]").forEach((checkbox) => checkbox.addEventListener("change", () => {
   const completed = new Set(JSON.parse(localStorage.getItem("aia-sop-completed") || "[]"));
   const step = Number(checkbox.dataset.sopStep);
   checkbox.checked ? completed.add(step) : completed.delete(step);
   localStorage.setItem("aia-sop-completed", JSON.stringify([...completed]));
   render();
 }));
 document.querySelector("#resetSop")?.addEventListener("click", () => {
   localStorage.removeItem("aia-sop-completed");
   render();
 });
 document.querySelectorAll("[data-library-category]").forEach((button) => button.addEventListener("click", () => {
   selectedLibraryCategory = button.dataset.libraryCategory;
   render();
   document.querySelector(".product-records")?.scrollIntoView({ behavior: "smooth", block: "start" });
 }));
 document.querySelectorAll(".product-record").forEach((record) => record.addEventListener("toggle", () => {
   if (record.open) loadDirectFiles(record.querySelector("[data-product-folder]"));
 }));
 document.querySelector("#addCompareProduct")?.addEventListener("click", () => {
   const select = document.querySelector("#compareProductSelect");
   if (!select.value || comparisonProductIds.length >= 4 || comparisonProductIds.includes(select.value)) return;
   comparisonProductIds = [...comparisonProductIds, select.value];
   render();
 });
 document.querySelectorAll("[data-remove-compare]").forEach((button) => button.addEventListener("click", () => {
   comparisonProductIds = comparisonProductIds.filter((id) => id !== button.dataset.removeCompare);
   render();
 }));
 document.querySelector("#startCompare")?.addEventListener("click", startProductComparison);
}

async function loadDirectFiles(list) {
 if (!list || list.dataset.loaded) return;
 list.dataset.loaded = "loading";
 try {
   const folderPath = ["assets", "library", list.dataset.library, list.dataset.productFolder].map(encodeURIComponent).join("/") + "/";
   const response = await fetch(folderPath, { cache: "no-store" });
   if (!response.ok) throw new Error("Unable to load files");
   const page = new DOMParser().parseFromString(await response.text(), "text/html");
   const files = Array.from(page.querySelectorAll("a"))
     .map((link) => ({ href: link.getAttribute("href"), name: link.textContent.trim() }))
     .filter((file) => file.href && /\.(pdf|png|jpe?g)$/i.test(file.name));
   list.innerHTML = files.length
     ? files.map((file) => {
       const isPdf = file.name.toLowerCase().endsWith(".pdf");
       return `<a href="${folderPath}${file.href}" target="_blank" rel="noreferrer"><span>${isPdf ? "產品資料" : "產品指引圖"}</span><small>${escapeHtml(file.name)}</small><b>${isPdf ? "開啟 PDF" : "查看圖片"} ↗</b></a>`;
     }).join("")
     : "<p>此產品目前未有 PDF 資料。</p>";
   list.dataset.loaded = "true";
 } catch (error) {
   list.innerHTML = "<p>未能載入資料，請重新啟動平台後再試。</p>";
   delete list.dataset.loaded;
 }
}

function matchPolicies() {
 const stage = document.querySelector("#profileStage").value, focus = document.querySelector("#profileFocus").value;
 document.querySelector("#matchingOutput").innerHTML = `<div class="result policy-result"><div class="result-top"><span class="tag">3 項相關資料</span><span class="source-status">來源已標示</span></div><h2>建議先準備這些內容</h2><p class="match-summary">根據「${escapeHtml(stage)}」及「${escapeHtml(focus)}」，以下為示範資料庫中較相關的已批准文件。</p><div class="document-match"><div class="doc-number">01</div><div><span class="doc-type">保障檢視</span><h3>《家庭保障檢視指南》</h3><p>可用作了解家庭責任、保障缺口與優先次序的會前框架。</p><small>示範來源：家庭保障檢視指南 · 2026.02 · 第 6–8 頁</small></div></div><div class="document-match"><div class="doc-number">02</div><div><span class="doc-type">產品摘要</span><h3>《安心未來保障計劃 - 概覽》</h3><p>用於會面前了解可討論的保障概念與常見問題。</p><small>示範來源：安心未來保障計劃概覽 · 2026.01 · 第 2–5 頁</small></div></div><div class="document-match"><div class="doc-number">03</div><div><span class="doc-type">常見問題</span><h3>《醫療保障對話參考》</h3><p>協助整理客戶可能關心的問題；不應替代正式條款說明。</p><small>示範來源：醫療保障對話參考 · 2026.02 · 第 3–4 頁</small></div></div><div class="warning">此處為模擬檢索結果，並非實際保單條款或建議。正式版只可顯示已審批、仍然有效的公司資料。</div></div>`;
}

function generateMeeting() {
 const stage = document.querySelector("#clientStage").value, type = document.querySelector("#clientType").value, goal = document.querySelector("#meetingGoal").value;
 document.querySelector("#meetingOutput").innerHTML = `<div class="result"><div class="result-top"><span class="tag">會前準備草稿</span><button class="text-button" id="copyMeeting">複製</button></div><h2>${escapeHtml(goal)}</h2><h3>會面目標</h3><p>在輕鬆、不預設結論的對話中，了解一位${escapeHtml(type)}的關注重點與保障優先次序。</p><h3>建議提問</h3><ol><li>「最近讓您最想為自己或家人多做準備的是什麼？」</li><li>「如果遇到突發情況，您最希望哪些生活安排不受影響？」</li><li>「在保障、預算和彈性之間，您現時最重視哪一項？」</li></ol><h3>溝通流程</h3><p>建立關係 → 了解生活階段（${escapeHtml(stage)}）→ 探索需要 → 總結重點 → 約定下一步。</p><div class="warning">合規提醒：避免保證回報、替客戶作決定或把此草稿視為正式建議。</div></div>`;
 document.querySelector("#copyMeeting").addEventListener("click", () => navigator.clipboard.writeText(document.querySelector("#meetingOutput").innerText));
}

function makeOutline(topic, count) {
 const all = ["封面｜" + topic, "為什麼現在值得關注", "常見情況與需要", "思考框架：目標、優先次序與預算", "可討論的下一步", "總結與問答", "謝謝"];
 return all.slice(0, count);
}
function generatePptOutline() {
 const topic = document.querySelector("#pptTopic").value.trim() || "家庭保障規劃入門";
 const count = Number(document.querySelector("#pptSlides").value.match(/\d+/)[0]); const outline = makeOutline(topic, count);
 document.querySelector("#pptOutput").innerHTML = `<div class="result"><div class="result-top"><span class="tag">${count} 頁大綱</span></div><h2>${escapeHtml(topic)}</h2><ol class="outline">${outline.map((x, i) => `<li><b>${i + 1}.</b> ${escapeHtml(x)}</li>`).join("")}</ol><button class="primary secondary" id="downloadPpt">下載可編輯 PPT ↓</button><p class="tiny">這是示範模板；正式使用前請替換為公司已批准的版式與內容。</p></div>`;
 document.querySelector("#downloadPpt").addEventListener("click", () => downloadPpt(topic, outline));
}
async function downloadPpt(topic, outline) {
 const pptx = new PptxGenJS(); pptx.layout = "LAYOUT_WIDE"; pptx.author = "AI 工作台 MVP"; pptx.subject = "演示草稿"; pptx.title = topic; pptx.company = "Internal MVP";
 outline.forEach((item, index) => { const slide = pptx.addSlide(); slide.background = { color: index === 0 ? "B51F2A" : "FAF7F2" }; slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 13.333, h: 0.18, fill: { color: "D9A441" }, line: { color: "D9A441" } }); slide.addText(index === 0 ? topic : item.replace(/^.*?｜/, ""), { x: 0.8, y: index === 0 ? 2.2 : 0.85, w: 11.7, h: 0.8, fontFace: "Arial", fontSize: index === 0 ? 34 : 26, bold: true, color: index === 0 ? "FFFFFF" : "251F1E", breakLine: false }); slide.addText(index === 0 ? "AI 工作台 · 可编辑演示草稿" : "请按公司审核要求编辑、核实并补充内容。", { x: 0.82, y: index === 0 ? 3.2 : 1.85, w: 10.8, h: 0.5, fontFace: "Arial", fontSize: 15, color: index === 0 ? "F7E6C1" : "6C625E" }); slide.addText(`${index + 1} / ${outline.length}`, { x: 11.8, y: 6.85, w: 0.8, h: 0.25, fontSize: 9, color: "6C625E", align: "right" }); });
 await pptx.writeFile({ fileName: `${topic.replace(/[\\/:*?"<>|]/g, "_")}_MVP草稿.pptx` });
}

function answerQuestion() {
 const q = document.querySelector("#userQuestion").value.trim() || "怎样把一个复杂工作任务拆成行动步骤？";
 document.querySelector("#questionOutput").innerHTML = `<div class="result"><div class="result-top"><span class="tag">工作建议草稿</span></div><h2>建议这样处理</h2><p>针对“${escapeHtml(q)}”，可先用一个可执行的小框架开始：</p><ol><li><b>明确结果：</b>写下完成后要交付什么，以及由谁确认。</li><li><b>拆成三步：</b>资料准备、制作第一版、审核与优化。</li><li><b>确定时间：</b>为每一步安排可完成的短时段。</li><li><b>先做最小版本：</b>先交出可讨论的草稿，而不是等待完美答案。</li></ol><h3>你现在可以做的第一步</h3><p>用一句话写下最终交付物，并列出需要确认的两件事。</p><div class="warning">此输出不是公司政策、条款解释或客户建议。相关事项请查阅正式文件并咨询主管。</div></div>`;
}

function startPractice() {
 practiceTurn = 0; const persona = document.querySelector("#persona").value, scenario = document.querySelector("#scenario").value;
 document.querySelector("#practiceOutput").innerHTML = `<div class="chat"><div class="chat-meta"><span class="tag">${escapeHtml(scenario)}</span><button class="text-button" id="finishPractice">结束并复盘</button></div><div id="messages"><div class="message ai"><b>模拟客户</b><p>你好。我是${escapeHtml(persona)}。我愿意了解一下，不过我担心这会不会超出预算。你想先从哪里谈起？</p></div></div><div class="reply"><textarea id="practiceReply" rows="3" placeholder="输入你的回应…"></textarea><button class="primary" id="sendReply">发送</button></div></div>`;
 document.querySelector("#sendReply").addEventListener("click", sendPracticeReply); document.querySelector("#finishPractice").addEventListener("click", finishPractice);
}
function sendPracticeReply() {
 const input = document.querySelector("#practiceReply"), reply = input.value.trim(); if (!reply) return; const replies = ["我明白。不过我以前已经听过类似介绍，最后还是不知道是否适合自己。", "如果我暂时不想决定，今天的讨论对我有什么实际帮助？", "我希望先照顾家庭需要，但也不想作出不理解的承诺。"]; const box = document.querySelector("#messages"); box.insertAdjacentHTML("beforeend", `<div class="message user"><b>你</b><p>${escapeHtml(reply)}</p></div><div class="message ai"><b>模拟客户</b><p>${replies[Math.min(practiceTurn++, replies.length - 1)]}</p></div>`); input.value = ""; box.scrollTop = box.scrollHeight;
}
function finishPractice() { document.querySelector("#practiceOutput").innerHTML = `<div class="result"><span class="tag">练习复盘</span><h2>你完成了一轮模拟</h2><h3>做得好的地方</h3><p>你愿意回应客户的预算顾虑，并保持对话开放。</p><h3>下次可尝试</h3><p>先确认客户最担心的事情，例如：“我理解预算是重点；您最希望先保障哪一件事？” 再进入说明。</p><div class="warning">训练反馈仅供学习，不构成销售、合规或产品建议。</div><button class="primary secondary" id="restartPractice">再练一次</button></div>`; document.querySelector("#restartPractice").addEventListener("click", startPractice); }

render();
