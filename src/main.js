import {panel as insurancePanel, bind as bindInsurance} from './insurance-ppt.js';
import {panel as salesToolPanel, bind as bindSalesTool} from './sales-tool-legacy.js';
import {compareSchema} from './compare-schema.js';
import {panel as medicalComparePanel, bind as bindMedicalCompare} from './medical-compare.js';
import {syncedMarketFiles, paymentFiles, guideFiles} from './synced-catalog-data.js';
import {masterVideoSeries} from './training-video-data.js?v=20261013-title-slash';
const modules = {
  salestool: { icon: "✦", title: "銷售工具", subtitle: "上傳計劃書，生成個案PPT", color: "gold" },
  matching: { icon: "◇", title: "會前準備", subtitle: "由客戶輪廓尋找已批准資料", color: "gold" },
  library: { icon: "▤", title: "產品資料", subtitle: "按產品類別查閱已批准資料", color: "wine" },
  claims: { icon: "✚", title: "理賠", subtitle: "理賠流程、表格與實務資料", color: "coral" },
  compare: { icon: "⇄", title: "產品對比", subtitle: "產品對比中心與資料庫產品對比", color: "teal" },
  meeting: { icon: "◎", title: "見客助手", subtitle: "3 分鐘整理會前準備", color: "teal" },
  ppt: { icon: "▣", title: "PPT 製作", subtitle: "生成可編輯演示文稿", color: "coral" },
  sop: { icon: "✓", title: "新人簽單 SOP", subtitle: "由入門到成交的學習路徑", color: "sage" },
  learning: { icon: "▶", title: "內部學習中心", subtitle: "課程影片與內部牌照研習資料", color: "plum" },
  question: { icon: "?", title: "問題助手", subtitle: "整理日常工作思路", color: "violet" },
  practice: { icon: "◌", title: "話術訓練", subtitle: "模擬客戶，練習應對", color: "amber" },
  market: { icon: "◈", title: "市場資訊", subtitle: "同業產品與市場參考資料", color: "blue" },
  promotion: { icon: "✧", title: "產品推廣", subtitle: "查閱產品推廣活動及優惠資料", color: "gold" },
  discontinued: { icon: "⌑", title: "停售產品", subtitle: "已停售產品的歷史參考資料", color: "ink" },
  payment: { icon: "$", title: "付費", subtitle: "繳費方式與操作指引", color: "gold" },
  guides: { icon: "▧", title: "指引", subtitle: "核保與賠償申請指引", color: "sage" },
};

const marketInformationFiles = syncedMarketFiles;

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
      <nav>${navItem("home", "⌂", "首頁")}${navGroup("library", ["promotion", "market", "discontinued", "payment", "guides", "claims", "compare"])}${navItem("sop", "✓", "新人簽單 SOP")}${navItem("learning", "▶", "內部學習中心")}${navItem("ppt", "▣", "PPT 製作")}</nav>
      <div class="sidebar-footer"><span class="status-dot"></span>示範模式<br><small>請勿輸入客戶個人資料</small></div>
    </aside>
    <main class="main"><header class="topbar"><button id="menuButton" class="menu-button">☰</button><div class="notice">此為內部示範版 · 所有輸出均須人工覆核後使用</div><div class="theme-preview" style="display:flex" role="group" aria-label="配色預覽"><span class="theme-label">配色</span><button title="高端商务蓝" class="theme-choice ${uiTheme === "executive-blue" ? "active" : ""}" data-theme-choice="executive-blue">商务蓝</button><button title="高端商务绿" class="theme-choice ${uiTheme === "executive-green" ? "active" : ""}" data-theme-choice="executive-green">商务绿</button><button title="高端象牙白" class="theme-choice ${uiTheme === "executive-white" ? "active" : ""}" data-theme-choice="executive-white">象牙白</button><button title="原始红色系" class="theme-choice ${uiTheme === "classic-red" ? "active" : ""}" data-theme-choice="classic-red">經典紅</button><button title="經典藏藍－啞光金" class="theme-choice ${uiTheme === "navy-gold" ? "active" : ""}" data-theme-choice="navy-gold">藏藍金</button><button title="炭灰黑－暗酒紅－香檳金" class="theme-choice ${uiTheme === "guardian" ? "active" : ""}" data-theme-choice="guardian">炭灰紅</button><button title="現代 Slate 灰藍" class="theme-choice ${uiTheme === "slate" ? "active" : ""}" data-theme-choice="slate">Slate</button><button title="深色模式－黑金尊享" class="theme-choice ${uiTheme === "black-gold" ? "active" : ""}" data-theme-choice="black-gold">黑金</button></div><div class="avatar">演</div></header>${sectionNavigation()}${content}</main>
  </div>`;
}
function navItem(id, icon, label) { return `<button class="nav-item ${currentModule === id ? "active" : ""}" data-route="${id}"><span>${icon}</span>${label}</button>`; }
const moduleGroups = { library: ["promotion", "market", "discontinued", "payment", "guides", "claims", "compare"], meeting: ["matching", "question", "practice"] };
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
  <section class="page dashboard"><div class="section-title"><div><p class="eyebrow">快速開始</p><h2>今天想完成什麼？</h2></div><span class="live-label"><i></i> 已連接示範資料庫</span></div><div class="card-grid">${Object.entries(modules).filter(([id]) => !["compare", "salestool", "meeting"].includes(id) && !Object.values(moduleGroups).flat().includes(id)).map(([id, m]) => `<button class="module-card ${m.color}" data-route="${id}"><div class="module-icon">${m.icon}</div><h3>${m.title}</h3><p>${m.subtitle}</p><span>進入工作流程 <b>→</b></span></button>`).join("")}</div>
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

function medicalComparePage() {
 return appShell(`<section class="page page-heading"><p class="eyebrow">產品對比</p><h1>產品對比</h1><p>已按原始文件夾整理 10 個產品品類及 107 份 PDF。每組案例均按來源文件提取可核對資料；未有明載的內容保留為「資料暫未提供」，不作推斷。睿選／睿選明珠完整案例歸入「友扣稅」。</p></section><section class="page">${medicalComparePanel()}</section>`);
}

function compare() {
 return medicalComparePage();
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
  const companies = new Map();
  marketInformationFiles.forEach((entry) => {
    const [company, type, ...path] = entry;
    if (!companies.has(company)) companies.set(company, { count: 0, types: new Map() });
    const companyGroup = companies.get(company);
    companyGroup.count += 1;
    if (!companyGroup.types.has(type)) companyGroup.types.set(type, []);
    companyGroup.types.get(type).push(path);
  });

  const buildTree = (paths) => {
    const root = { files: [], folders: new Map(), count: 0 };
    paths.forEach((parts) => {
      let node = root;
      node.count += 1;
      parts.slice(0, -1).forEach((folder) => {
        if (!node.folders.has(folder)) node.folders.set(folder, { files: [], folders: new Map(), count: 0 });
        node = node.folders.get(folder);
        node.count += 1;
      });
      node.files.push(parts.at(-1));
    });
    return root;
  };

  const renderTree = (node, baseParts, level = 0) => {
    const directFiles = node.files.length ? `<div class="catalog-files market-direct-files">${node.files.map((filename) => fileLink("assets/market-info", [...baseParts, filename])).join("")}</div>` : "";
    const folders = [...node.folders.entries()].map(([folder, child]) => `<details class="market-folder" data-level="${level}"><summary><span>${escapeHtml(folder)}</span><small>${child.count} 份</small></summary><div class="market-folder-body">${renderTree(child, [...baseParts, folder], level + 1)}</div></details>`).join("");
    return `${directFiles}${folders}`;
  };

  const sections = [...companies.entries()].map(([company, companyGroup]) => {
    const types = [...companyGroup.types.entries()].map(([type, paths]) => `<details class="market-type"><summary><span>${escapeHtml(type)}</span><small>${paths.length} 份資料</small></summary><div class="market-type-body">${renderTree(buildTree(paths), [company, type])}</div></details>`).join("");
    return `<details class="market-company"><summary><div><span>保險公司</span><h2>${escapeHtml(company)}</h2></div><div class="market-company-meta"><b>${companyGroup.types.size}</b><span>個類別</span><b>${companyGroup.count}</b><span>份資料</span></div></summary><div class="market-company-body">${types}</div></details>`;
  }).join("");
  return appShell(`<section class="page page-heading"><p class="eyebrow">市場資訊</p><h1>同業資料，<br>集中作市場參考。</h1><p>共 ${marketInformationFiles.length} 份資料，已按保險公司、產品類別及原始子文件夾分層整理。</p></section><section class="page catalog-notice"><b>使用範圍</b><span>只供內部市場研究及培訓參考，不可視作產品建議、銷售文件或最新條款。使用前請自行核實資料日期與來源。</span></section><section class="page market-catalog">${sections}</section>`);
}

function payment() {
  const files = paymentFiles.map((parts) => fileLink("assets/payment", parts)).join("");
  return appShell(`<section class="page page-heading"><p class="eyebrow">產品資料</p><h1>付費</h1><p>繳費方式與操作指引集中存放，點選即可開啟原始 PDF。</p></section><section class="page catalog-grid"><section class="catalog-group"><div><span>付費資料</span><h2>繳費方式及指引</h2><small>${paymentFiles.length} 份資料</small></div><div class="catalog-files">${files}</div></section></section>`);
}

function guides() {
  const groups = new Map();
  guideFiles.forEach(([category, ...path]) => { if (!groups.has(category)) groups.set(category, []); groups.get(category).push(path); });
  const sections = [...groups.entries()].map(([category, files]) => `<section class="catalog-group"><div><span>內部指引</span><h2>${escapeHtml(category)}</h2><small>${files.length} 份資料</small></div><div class="catalog-files">${files.map((path) => fileLink("assets/guides", [category, ...path])).join("")}</div></section>`).join("");
  return appShell(`<section class="page page-heading"><p class="eyebrow">產品資料</p><h1>指引</h1><p>核保與賠償相關資料按類別整理，點選即可開啟原始 PDF。</p></section><section class="page catalog-notice"><b>使用提示</b><span>資料只供內部工作參考，實際個案請以公司最新流程、要求及正式文件為準。</span></section><section class="page catalog-grid">${sections}</section>`);
}

const claimDocumentGroups = [
  ["01_意外賠償", "意外賠償", "事故證明、保障條款、契約摘要、常見問題及申請指引", ["保险计划附加契约.pdf", "基本定义及契约条款.pdf", "常见问题.pdf", "意外计划附加契约摘要.pdf", "赔偿申请指引.pdf"]],
  ["02_醫療賠償", "醫療賠償", "住院、手術、醫療保障條款、惠益表及申請指引", ["亚洲至尊至尊医疗尊贵医疗一览表.pdf", "住院保险计划附加契约.pdf", "住院手术赔偿附加契约倍无忧医疗一览表.pdf", "住院赔偿医疗所需条款.pdf", "基本定义及保单条款.pdf", "常见问题.pdf", "惠益一览表.pdf", "意外及医疗住院惠益一览表.pdf", "手术项目表.pdf", "赔偿申请指引.pdf"]],
  ["03_傷殘賠償", "傷殘賠償", "傷殘定義、條款、惠益、常見問題及申請指引", ["基本定义及条款.pdf", "常见问题.pdf", "残废惠益.pdf", "赔偿申请指引.pdf"]],
  ["04_危疾賠償", "危疾賠償", "危疾保障、保單定義、附加契約、惠益表及申請指引", ["保障计划附加契约.pdf", "危疾基本计划一览表.pdf", "危疾附加契约一览表.pdf", "基本保障一览表.pdf", "基本定义及保单条款.pdf", "常见问题.pdf", "惠益一览表.pdf", "赔偿申请指引.pdf"]],
  ["05_旅遊保險賠償", "旅遊保險賠償", "旅遊保險索償常見問題及申請程序", ["常见问题.pdf", "赔偿申请指引.pdf"]],
  ["06_身故賠償", "身故賠償", "身故索償總覽、常見問題及申請指引", ["常见问题.pdf", "赔偿申请指引.pdf", "身故赔偿总览.pdf"]],
];

function claims() {
 const portal = "https://www3.aia.com.hk/department/ops/getFileList.do";
 const sources = [
  ["i培訓資訊", ["「綜合索償表格」用戶指南", "「電子待決回覆」用戶指南"], `${portal}?path=Claims+-+iTraining+Materials&mainid=003&secondid=003.020&type=1&lang=zh`],
  ["理賠管理模式 · 常見問題", ["說明文件－「合理及慣常」", "常見問題－非特級／特級「健康之寶」（墊底費版本）", "常見問題－「合理及慣常」", "簡單手術參考表"], `${portal}?path=Claims_Management%5CFAQ&mainid=003&secondid=003.010&type=1&lang=zh`],
  ["賠償小錦囊", ["「賠償小錦囊」索償申請實務參考"], `${portal}?path=Claims%5CTips+on+Claims+Application&mainid=003&secondid=003.007&type=1&lang=zh`]
 ];
 const sourceCards = sources.map(([title, files, href]) => `<article class="claims-source"><div class="claims-source-head"><span>內部</span><b>${escapeHtml(title)}</b><a href="${href}" target="_blank" rel="noreferrer">開啟資料頁 ↗</a></div><ul>${files.map((file) => `<li>${escapeHtml(file)}</li>`).join("")}</ul></article>`).join("");
 const resourceMap = [
  ["首次提交索償", "「綜合索償表格」用戶指南", "確認表格填寫、文件準備及提交方式。"],
  ["收到待決／補件通知", "「電子待決回覆」用戶指南", "按通知逐項回覆並補交文件。"],
  ["查詢醫療費用是否合理", "「合理及慣常」說明文件與常見問題", "了解費用審核原則；個案結果仍以理賠部審批為準。"],
  ["確認手術分類", "簡單手術參考表", "先作工作參考，實際分類以最新公司準則及個案審核為準。"],
  ["處理健康之寶相關個案", "非特級／特級「健康之寶」常見問題", "核對指定產品及墊底費版本的常見處理問題。"],
  ["需要索償實務提醒", "賠償小錦囊", "快速檢查申請細節、常見遺漏與跟進重點。"]
 ].map(([scenario, resource, note]) => `<article><span>${escapeHtml(scenario)}</span><b>${escapeHtml(resource)}</b><p>${escapeHtml(note)}</p></article>`).join("");
 const claimTypes = [
  ["住院／醫療", "住院、手術、日間治療及門診相關索償；先核對保障範圍、醫療需要、合理及慣常費用與自付費。"],
  ["危疾／癌症", "核對疾病定義、嚴重程度、等候期、生存期及過往索償；診斷名稱本身不等於符合保單定義。"],
  ["意外", "整理事故經過、日期、地點、受傷機制與治療紀錄；需要時補充警方、僱主或事故證明。"],
  ["身故", "核對受保人、保單狀況、身故原因、受益人及遺產文件；個案文件要求須以公司最新通知為準。"],
  ["傷殘／收入保障", "確認職業、不能工作期間、醫療限制及持續證明，並留意定期覆核和待決要求。"],
  ["保費豁免／其他", "先確定觸發條件、相關基本計劃或附加契約，再按指定表格及證明文件辦理。"]
 ].map(([title, text]) => `<article><b>${title}</b><p>${text}</p></article>`).join("");
 const steps = [
  ["01", "確認保障", "核對保單號碼、受保人、保障項目、保障期、自付費／墊底費及不保事項。"],
  ["02", "選擇索償類別", "按醫療、危疾、意外、身故、傷殘或其他惠益選用最新表格及渠道。"],
  ["03", "準備文件", "整理索償表格、身份及保單資料、醫療證明、收據／費用明細和個案所需補充文件。"],
  ["04", "提交與留底", "經公司指定渠道提交；保留提交日期、文件清單及參考編號，避免重複或遺漏。"],
  ["05", "回覆待決", "使用電子待決回覆或指定渠道補交資料；逐項對照要求並記錄完成情況。"],
  ["06", "結果跟進", "向客戶解釋處理狀態和下一步，不預先承諾賠償；需要時按正式程序查詢或覆核。"]
 ].map(([no, title, text]) => `<li><span>${no}</span><div><b>${title}</b><p>${text}</p></div></li>`).join("");
 const localClaimDocuments = claimDocumentGroups.map(([folder, title, description, files]) => `<section class="catalog-group"><div><span>理賠資料</span><h2>${escapeHtml(title)}</h2><p>${escapeHtml(description)}</p><small>${files.length} 份文件</small></div><div class="catalog-files">${files.map((filename) => fileLink("assets/claims", [folder, filename])).join("")}</div></section>`).join("");
 return appShell(`<section class="page page-heading claims-heading"><p class="eyebrow">產品資料 · 理賠</p><h1>理賠工作台</h1><p>按實際處理流程集中整理索償指南、表格、待決回覆與常見問題；原始資料來自AIA營運部內部網站。</p></section>
 <section class="page catalog-notice claims-notice"><b>使用原則</b><span>本頁為內部工作索引，不構成賠償承諾。個案要求、表格版本、時限及審批結果均以公司最新正式文件和理賠部通知為準。</span></section>
 <section class="page claims-grid"><article class="claims-panel claims-flow"><div class="panel-kicker">索償流程</div><h2>從確認保障到結果跟進</h2><ol>${steps}</ol></article><article class="claims-panel"><div class="panel-kicker">提交前檢查</div><h2>常用文件清單</h2><ul class="claims-checklist"><li>最新版本索償表格及所需簽署</li><li>保單／受保人／索償人基本資料</li><li>診斷證明、出院摘要、病理或檢查報告</li><li>正本收據、費用明細及付款證明（如適用）</li><li>意外、警方、僱主或其他第三方證明（如適用）</li><li>銀行資料、授權或受益人／遺產文件（視索償類別）</li></ul><p class="claims-tip">文件要求因產品、事故及索償類別而異；收到待決通知後，以通知逐項補交。</p></article></section>
 <section class="page claims-panel"><div class="panel-kicker">理賠類型</div><h2>按索償性質整理</h2><div class="claims-types">${claimTypes}</div></section>
 <section class="page claims-panel"><div class="panel-kicker">快速查找</div><h2>遇到這種情況，先看哪份資料</h2><div class="claims-resource-map">${resourceMap}</div></section>
 <section class="page learning-list-heading"><div><div class="panel-kicker">本機資料庫</div><h2>按理賠類型查找文件</h2><p>已將新增文件按索償性質分類；點選文件名稱即可開啟原始 PDF。</p></div><span>32 份文件</span></section><section class="page catalog-grid claims-document-grid">${localClaimDocuments}</section>
 <section class="page claims-panel"><div class="panel-kicker">內部資料入口</div><h2>已核對的AIA理賠資料與文件</h2><p class="claims-intro">下列文件名稱已按內部網站逐項整理。網站另設一般指引、AIAS全球緊急支援服務、賠償監管措施、賠償部服務承諾、表格、資料庫及個人療程管理服務等分類；開啟資料頁需要AIA內部帳戶權限。</p><div class="claims-sources">${sourceCards}</div></section>
 <section class="page claims-panel claims-practice"><div class="panel-kicker">實務提示</div><h2>處理個案時避免這些問題</h2><div><p><b>不要先承諾：</b>是否賠償及賠償金額須經正式審核。</p><p><b>不要自行推斷：</b>疾病名稱、手術名稱或住院事實不一定等同符合保單定義。</p><p><b>不要遺漏時序：</b>記錄事故、診斷、治療、提交及補件日期。</p><p><b>不要混用版本：</b>只使用公司網站上的最新表格和指引。</p></div></section>`);
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
  4: [["library", "開啟產品資料"], ["meeting", "開啟見客助手"], ["ppt", "開啟 PPT 製作"]],
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

const masterBooks = [
  ["01", "醫療天書 2026［完整版］（繁體）", "完整醫療保障參考資料", "assets/training/masters/books/醫療天書 2026 [完整版] (繁體).pdf", "完整版"],
  ["02", "醫療天書 2026［精華版］（繁體）", "快速掌握醫療保障重點", "assets/training/masters/books/醫療天書 2026 [精華版] (繁體).pdf", "精華版"],
  ["03", "退休天書（2026年9月 · 繁體中文）", "退休規劃內部研習資料", "assets/training/masters/books/(2026年9月) 退休天書 (繁體中文).pdf", "最新版"],
];

const learningResourceGroups = [
  ["01_培訓系統", "培訓系統", "內部培訓系統與學習路徑", ["S · E · E · 0 · 培 訓 系 统（MMTS 的培訓系統）.pdf"]],
  ["02_跨境業務", "跨境業務", "抵港內地人士業務參考", ["抵港內地人士業務.pdf"]],
  ["03_傳承規劃", "傳承規劃", "家族信託、傳承溝通與證書課程", ["信託在家族傳承中的應用.pdf", "傅承話術.pdf", "傳承大使證書課程.pdf"]],
  ["04_退休規劃", "退休規劃", "保單逆按與退休收入規劃參考", ["保單逆按計劃 260202.pdf"]],
];

function masterSubtitleAsset(video, extension, language = "traditional") {
 const simplified = language === "simplified";
 const explicit = extension === ".vtt" ? (simplified ? video.subtitleSimplified : video.subtitle) : (simplified ? video.transcriptSimplified : video.transcript);
 if (explicit) return explicit;
 return video.src.replace("/videos/", simplified ? "/subtitles-simplified/" : "/subtitles/").replace(/\.mp4$/i, extension);
}

function learning() {
 const firstVideo = masterVideoSeries[0].videos[0];
 const videoCount = masterVideoSeries.reduce((total, group) => total + group.videos.length, 0);
 const collectionTabs = masterVideoSeries.map((group, groupIndex) => `<button type="button" class="master-collection-tab ${groupIndex === 0 ? "active" : ""}" data-master-collection="${groupIndex}"><span>${String(groupIndex + 1).padStart(2, "0")}</span><div><b>${escapeHtml(group.title)}</b><small>${escapeHtml(group.subtitle)}</small></div><em>${group.videos.length} 段</em></button>`).join("");
 const series = masterVideoSeries.map((group, groupIndex) => `<section class="master-series-panel ${groupIndex === 0 ? "active" : ""}" data-master-series-panel="${groupIndex}"><div class="master-video-grid">${group.videos.map((video, videoIndex) => `<button class="master-video-card ${groupIndex === 0 && videoIndex === 0 ? "active" : ""}" data-master-video="${encodeURI(video.src)}" data-master-title="${escapeHtml(video.title)}" data-master-subtitle-traditional="${encodeURI(masterSubtitleAsset(video, ".vtt", "traditional"))}" data-master-subtitle-simplified="${encodeURI(masterSubtitleAsset(video, ".vtt", "simplified"))}" data-master-transcript-traditional="${encodeURI(masterSubtitleAsset(video, ".json", "traditional"))}" data-master-transcript-simplified="${encodeURI(masterSubtitleAsset(video, ".json", "simplified"))}"><span>${String(videoIndex + 1).padStart(2, "0")}</span><div><b>${escapeHtml(video.title)}</b><small>繁／簡字幕及文本</small></div><i>▶</i></button>`).join("")}</div></section>`).join("");
 const books = masterBooks.map(([number, title, description, href, label]) => `<a class="learning-material" href="${encodeURI(href)}" target="_blank" rel="noreferrer"><span class="material-number">${number}</span><span class="material-file">▤</span><div><b>${title}</b><small>${description}</small></div><i>${label}</i><em>開啟 <strong>↗</strong></em></a>`).join("");
 const studyResources = learningResourceGroups.map(([folder, title, description, files]) => `<section class="catalog-group"><div><span>專題研習</span><h2>${escapeHtml(title)}</h2><p>${escapeHtml(description)}</p><small>${files.length} 份資料</small></div><div class="catalog-files">${files.map((filename) => fileLink("assets/training/resources", [folder, filename])).join("")}</div></section>`).join("");
 return appShell(`<section class="page learning-hero"><div><p class="eyebrow">內部學習中心 · 高手分享</p><h1>向高手學習，<br>把經驗變成行動。</h1><p>實戰分享、成長課程與天書系列資料</p></div><div class="learning-hero-stats"><div><b>01</b><span>分享影片</span></div><div><b>02</b><span>課程系列</span></div><div><b>03</b><span>天書資料</span></div></div></section><section class="page learning-warning"><b>內部學習材料</b><span>此區只供內部培訓使用，不可轉發客戶或第三方。對客內容仍須以公司最新正式批准文件為準。</span></section><section class="page master-collections"><div class="learning-list-heading"><div><div class="panel-kicker">影片合集</div><h2>高手分享</h2><p>先選擇合集，再從下方課程目錄播放影片。</p></div><span>${videoCount} 段影片</span></div><div class="master-collection-tabs">${collectionTabs}</div></section><section class="page masters-layout"><div class="master-player"><div class="course-label">高手分享 · 現正播放</div><h2 id="masterVideoTitle">${escapeHtml(firstVideo.title)}</h2><video id="masterVideoPlayer" controls preload="metadata" class="course-video" data-transcript-traditional="${encodeURI(masterSubtitleAsset(firstVideo, ".json", "traditional"))}" data-transcript-simplified="${encodeURI(masterSubtitleAsset(firstVideo, ".json", "simplified"))}"><source src="${encodeURI(firstVideo.src)}" type="video/mp4"><track id="masterVideoTrackTraditional" kind="captions" srclang="zh-Hant" label="繁體中文字幕" src="${encodeURI(masterSubtitleAsset(firstVideo, ".vtt", "traditional"))}" default><track id="masterVideoTrackSimplified" kind="captions" srclang="zh-Hans" label="简体中文字幕" src="${encodeURI(masterSubtitleAsset(firstVideo, ".vtt", "simplified"))}">你的瀏覽器未能直接播放此影片。</video><div class="master-seek-controls"><button type="button" id="masterSeekBack" aria-label="後退十秒">↶ 10秒</button><span id="masterCurrentTime">00:00</span><input id="masterSeekBar" type="range" min="0" max="0" step="0.1" value="0" aria-label="影片播放進度"><span id="masterDuration">00:00</span><button type="button" id="masterSeekForward" aria-label="前進十秒">10秒 ↷</button></div><p>可拖動上方進度條前進或後退；字幕預設為繁體，可隨時切換簡體。</p></div><section class="master-transcript"><div class="master-transcript-head"><div><span>字幕文本與視頻精華</span><h3 id="masterTranscriptTitle">${escapeHtml(firstVideo.title)}</h3></div><button type="button" id="copyMasterTranscript">複製全文</button></div><div class="master-language-row"><span>字幕及文本</span><button type="button" class="active" data-master-language="traditional">繁體</button><button type="button" data-master-language="simplified">简体</button></div><div id="masterTranscriptBody" class="master-transcript-body"><p class="transcript-loading">正在載入字幕文本…</p></div></section></section><section class="page master-catalog"><div class="learning-list-heading"><div><div class="panel-kicker">課程目錄</div><h2 id="masterCollectionTitle">${escapeHtml(masterVideoSeries[0].title)}</h2></div><span id="masterCollectionCount">${masterVideoSeries[0].videos.length} 段</span></div>${series}</section><section class="page learning-list master-books"><div class="learning-list-heading"><div><div class="panel-kicker">研習資料</div><h2>天書系列</h2><p>按主題整理的內部參考資料，可直接開啟 PDF 閱讀。</p></div><span>3 份資料</span></div>${books}</section><section class="page learning-list-heading"><div><div class="panel-kicker">新增資料</div><h2>專題研習資料</h2><p>按用途整理培訓、跨境業務、傳承及退休規劃文件。</p></div><span>6 份資料</span></section><section class="page catalog-grid learning-resource-grid">${studyResources}</section><section class="page learning-next"><b>學習提示</b><span>先按系列觀看影片，再使用天書及專題資料整理重點；實際應用前請核對最新正式資料。</span><button class="primary secondary" data-route="sop">前往新人簽單 SOP <span>→</span></button></section>`);
}

function ppt() { return appShell(insurancePanel()); }
function salestool() { return appShell(salesToolPanel()); }

function question() {
 return appShell(`<section class="page page-heading"><p class="eyebrow">問題助手</p><h1>把問題變成下一步行動</h1><p>適合整理工作思路、草擬文案和拆分任務。</p></section><section class="page single"><div class="panel"><h2>你想解決什麼問題？</h2>${textField("問題描述", "userQuestion", "例如：怎樣為新人安排一場 30 分鐘的產品培訓？", 5)}<div class="quick-prompts"><button data-question="幫我擬一封會議後的跟進電郵">跟進電郵</button><button data-question="幫我把一個複雜工作任務拆成行動步驟">拆分任務</button><button data-question="幫我整理一場培訓的議程">培訓議程</button></div><button class="primary" id="askQuestion">整理建議 ✦</button></div><div class="panel answer-box" id="questionOutput"><div class="empty-state"><div>?</div><h3>從一個問題開始</h3><p>輸出僅作工作草稿；涉及條款、監管或客戶決定，請查閱正式文件並諮詢主管。</p></div></div></section>`);
}

function practice() {
 return appShell(`<section class="page page-heading"><p class="eyebrow">話術訓練</p><h1>先在這裡練習，再走進會面</h1><p>AI 會模擬一位客戶；完成後獲得覆盤建議。</p></section><section class="page two-column"><div class="panel"><h2>設定練習</h2>${formField("客戶角色", "persona", ["剛成家的年輕父母", "價格敏感的年輕專業人士", "已有保障、但猶豫是否檢視的客戶"])}${formField("練習場景", "scenario", ["首次約見", "了解需求", "處理預算異議", "保障檢視開場"])}${formField("難度", "difficulty", ["基礎", "普通", "挑戰"])}<button class="primary" id="startPractice">開始模擬對話 →</button><p class="tiny">示範版為文字練習，不代表銷售建議。</p></div><div class="panel chat-panel" id="practiceOutput"><div class="empty-state"><div>◌</div><h3>選擇情境後開始</h3><p>系統會先扮演客戶提出第一句回應。</p></div></div></section>`);
}

function render() {
 document.documentElement.dataset.theme = getUiTheme();
 const page = { home, salestool, matching, library, compare, market, promotion, discontinued, payment, guides, claims, meeting, sop, learning, ppt, question, practice }[currentModule]();
 document.querySelector("#app").innerHTML = page;
 document.querySelectorAll("[data-route]").forEach(el => el.addEventListener("click", () => { currentModule = el.dataset.route; render(); }));
 document.querySelectorAll("[data-theme-choice]").forEach((button) => button.addEventListener("click", () => {
   localStorage.setItem("aia-ui-theme", button.dataset.themeChoice);
   render();
 }));
 document.querySelector("#menuButton").addEventListener("click", () => document.querySelector(".sidebar").classList.toggle("open"));
 bindPage();
}

function transcriptClock(seconds) {
 const total = Math.max(0, Math.floor(Number(seconds) || 0));
 return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

function bindMasterSeekControls() {
 const player = document.querySelector("#masterVideoPlayer");
 const seek = document.querySelector("#masterSeekBar");
 const current = document.querySelector("#masterCurrentTime");
 const duration = document.querySelector("#masterDuration");
 if (!player || !seek || !current || !duration) return;
 const syncDuration = () => {
   const total = Number.isFinite(player.duration) ? player.duration : 0;
   seek.max = String(total);
   duration.textContent = transcriptClock(total);
 };
 const syncTime = () => {
   if (!seek.matches(":active")) seek.value = String(player.currentTime || 0);
   current.textContent = transcriptClock(player.currentTime);
 };
 player.addEventListener("loadedmetadata", syncDuration);
 player.addEventListener("durationchange", syncDuration);
 player.addEventListener("timeupdate", syncTime);
 player.addEventListener("emptied", () => { seek.value = "0"; seek.max = "0"; current.textContent = "00:00"; duration.textContent = "00:00"; });
 seek.addEventListener("input", () => {
   const target = Number(seek.value) || 0;
   player.currentTime = target;
   current.textContent = transcriptClock(target);
 });
 document.querySelector("#masterSeekBack")?.addEventListener("click", () => { player.currentTime = Math.max(0, player.currentTime - 10); });
 document.querySelector("#masterSeekForward")?.addEventListener("click", () => { player.currentTime = Math.min(Number.isFinite(player.duration) ? player.duration : player.currentTime + 10, player.currentTime + 10); });
 if (player.readyState >= 1) syncDuration();
 syncTime();
}

function transcriptTextHtml(value) {
 return escapeHtml(String(value || "")).replace(/【待確認：([^】]*)】/g, '<mark class="transcript-uncertain" title="语音识别把握较低，请核对原声">$1</mark>');
}

function cleanTranscriptText(value) {
 return String(value || "").replace(/【待確認：([^】]*)】/g, "$1");
}

async function loadMasterTranscript(url, fallbackTitle) {
 const body = document.querySelector("#masterTranscriptBody");
 const title = document.querySelector("#masterTranscriptTitle");
 const copyButton = document.querySelector("#copyMasterTranscript");
 if (!body || !title || !copyButton) return;
 title.textContent = fallbackTitle || "影片字幕文本";
 copyButton.disabled = true;
 copyButton.dataset.copyText = "";
 if (!url) {
   body.innerHTML = `<div class="transcript-empty"><b>此影片的字幕正在整理</b><span>完成後會在這裡顯示重點及完整字幕文本。</span></div>`;
   return;
 }
 body.innerHTML = `<p class="transcript-loading">正在載入字幕文本…</p>`;
 try {
   const response = await fetch(url);
   if (response.status === 404) {
     body.innerHTML = `<div class="transcript-empty"><b>此影片的字幕正在整理</b><span>本機完成轉寫後，重新整理頁面即可查看。</span></div>`;
     return;
   }
   if (!response.ok) throw new Error(`HTTP ${response.status}`);
   const data = await response.json();
   title.textContent = fallbackTitle || data.title || "影片字幕文本";
   const summary = (data.summary || []).map((item) => `<li>${transcriptTextHtml(item)}</li>`).join("");
   const paragraphs = (data.paragraphs || []).map((item) => `<article class="transcript-paragraph"><button type="button" data-transcript-time="${Number(item.start) || 0}">${transcriptClock(item.start)}</button><p contenteditable="true" spellcheck="false" title="可直接点击修改字幕文本">${transcriptTextHtml(item.text)}</p></article>`).join("");
   body.innerHTML = `${summary ? `<div class="transcript-summary"><b>本集精要</b><ul>${summary}</ul></div>` : ""}<div class="transcript-full"><div class="transcript-full-head"><b>完整字幕文本</b><span>点击正文即可编辑</span></div>${paragraphs}</div>`;
   copyButton.dataset.copyText = (data.paragraphs || []).map((item) => `[${transcriptClock(item.start)}] ${cleanTranscriptText(item.text)}`).join("\n\n");
   copyButton.disabled = !copyButton.dataset.copyText;
   body.querySelectorAll("[data-transcript-time]").forEach((button) => button.addEventListener("click", () => {
     const player = document.querySelector("#masterVideoPlayer");
     if (!player) return;
     player.currentTime = Number(button.dataset.transcriptTime) || 0;
     player.play().catch(() => {});
   }));
 } catch (error) {
   body.innerHTML = `<div class="transcript-empty"><b>字幕文本暫時無法載入</b><span>${escapeHtml(error.message)}</span></div>`;
 }
}

function setMasterLanguage(language = "traditional") {
 const player = document.querySelector("#masterVideoPlayer");
 const title = document.querySelector("#masterVideoTitle")?.textContent || "影片字幕文本";
 if (!player) return;
 document.querySelectorAll("[data-master-language]").forEach((button) => button.classList.toggle("active", button.dataset.masterLanguage === language));
 if (player.textTracks.length >= 2) {
   player.textTracks[0].mode = language === "traditional" ? "showing" : "disabled";
   player.textTracks[1].mode = language === "simplified" ? "showing" : "disabled";
 }
 const transcript = language === "simplified" ? player.dataset.transcriptSimplified : player.dataset.transcriptTraditional;
 loadMasterTranscript(transcript, title);
}

function bindPage() {
 bindInsurance();
 bindSalesTool();
 bindMasterSeekControls();
 document.querySelector("#generateMeeting")?.addEventListener("click", generateMeeting);
 document.querySelector("#matchPolicies")?.addEventListener("click", matchPolicies);
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
 document.querySelectorAll("[data-master-collection]").forEach((button) => button.addEventListener("click", () => {
   const selected = button.dataset.masterCollection;
   document.querySelectorAll("[data-master-collection]").forEach((item) => item.classList.toggle("active", item === button));
   document.querySelectorAll("[data-master-series-panel]").forEach((panel) => panel.classList.toggle("active", panel.dataset.masterSeriesPanel === selected));
   const group = masterVideoSeries[Number(selected)];
   const title = document.querySelector("#masterCollectionTitle");
   const count = document.querySelector("#masterCollectionCount");
   if (title && group) title.textContent = group.title;
   if (count && group) count.textContent = `${group.videos.length} 段`;
   document.querySelector(".master-catalog")?.scrollIntoView({ behavior: "smooth", block: "start" });
 }));
 document.querySelectorAll("[data-master-video]").forEach((button) => button.addEventListener("click", () => {
   const player = document.querySelector("#masterVideoPlayer");
   const title = document.querySelector("#masterVideoTitle");
   if (!player || !title) return;
   player.src = button.dataset.masterVideo;
   const traditionalTrack = document.querySelector("#masterVideoTrackTraditional");
   const simplifiedTrack = document.querySelector("#masterVideoTrackSimplified");
   if (traditionalTrack) traditionalTrack.src = button.dataset.masterSubtitleTraditional || "";
   if (simplifiedTrack) simplifiedTrack.src = button.dataset.masterSubtitleSimplified || "";
   player.dataset.transcriptTraditional = button.dataset.masterTranscriptTraditional || "";
   player.dataset.transcriptSimplified = button.dataset.masterTranscriptSimplified || "";
   title.textContent = button.dataset.masterTitle;
   document.querySelectorAll("[data-master-video]").forEach((item) => item.classList.toggle("active", item === button));
   player.load();
   setMasterLanguage("traditional");
   window.setTimeout(() => setMasterLanguage("traditional"), 0);
   player.play().catch(() => {});
   player.scrollIntoView({ behavior: "smooth", block: "center" });
 }));
 document.querySelectorAll("[data-master-language]").forEach((button) => button.addEventListener("click", () => setMasterLanguage(button.dataset.masterLanguage)));
 document.querySelector("#copyMasterTranscript")?.addEventListener("click", async (event) => {
   const edited = [...document.querySelectorAll(".transcript-paragraph")].map((item) => {
     const time = item.querySelector("button")?.textContent || "";
     const content = item.querySelector("p")?.innerText || "";
     return `[${time}] ${content}`;
   }).join("\n\n");
   const text = edited || event.currentTarget.dataset.copyText;
   if (!text) return;
   await navigator.clipboard.writeText(text);
   event.currentTarget.textContent = "已複製";
   window.setTimeout(() => { event.currentTarget.textContent = "複製全文"; }, 1500);
 });
 if (document.querySelector("#masterTranscriptBody")) setMasterLanguage("traditional");
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
 bindMedicalCompare();
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
