export const compareSchema = {
  name: "product_compare_v1",
  instructions: [
    "只可使用 products[] 內提供的產品資料及來源檔案。",
    "不得根據產品名稱、一般保險知識或未提供文件推測任何保障、條款、回報、保費或資格。",
    "任何未提供的欄位，一律輸出「資料暫未提供」。",
    "比較表的欄位及產品欄必須依 products[] 動態產生，不得假設產品數量。"
  ],
  comparisonRules: {
    dimensionOrder: ["基礎資料", "主要保障", "現金惠益", "其他保障", "無索償惠益", "附加保障"],
    comparisonLogic: [
      "先按同一產品類別比較；不同保障結構、保障地域、限額、受保狀況及賠償項目須分開列示。",
      "✓／×只可用於產品文件明確載明的有／無保障；附帶限制、選項或條件須保留原文短句，不可自行概括為✓。",
      "金額、年期、百分比及貨幣須按來源原樣輸出，不作換算、排序或優劣判斷。",
      "同一欄位在多份來源出現時，保留各來源；未找到時一律顯示「資料暫未提供」。"
    ],
    outputRules: [
      "前端先以分組橫向表呈現；產品欄依 products[] 順序動態生成。",
      "摘要只列3至5項已提取的核心差異，並以中性語氣描述。",
      "各產品特色、注意事項及總結只可重述已提取欄位，不得判斷哪一項產品較佳。",
      "每項比較保留檔名來源；比較結果只供內部參考，正式使用以產品文件為準。"
    ]
  },
  output: {
    coreDifferences: [{ field: "", values: {} }],
    comparisonTable: [{ field: "", values: {} }],
    productHighlights: [{ productId: "", highlights: [] }],
    summary: ""
  },
  generic: {
    fields: [
      { key: "productNature", label: "計劃／產品性質", aliases: ["基本計劃", "附加契約", "保險計劃", "產品性質", "保障計劃"], group: "基礎資料", priority: 1, type: "text" },
      { key: "mainBenefits", label: "主要保障／利益", aliases: ["主要保障", "保障內容", "保險利益", "保障項目", "主要利益"], group: "主要保障", priority: 2, type: "text" },
      { key: "benefitLimit", label: "保障金額／限額", aliases: ["保額", "保障額", "賠償限額", "最高賠償額", "保障限額"], group: "主要保障", priority: 3, type: "number" },
      { key: "coveragePeriod", label: "保障年期", aliases: ["保障年期", "保障期", "保單年期", "保障至", "終身"], group: "基礎資料", priority: 4, type: "text" },
      { key: "premiumPaymentTerm", label: "繳費年期", aliases: ["保費繳付期", "繳費年期", "供款年期", "保費年期"], group: "基礎資料", priority: 5, type: "text" },
      { key: "premiumInfo", label: "保費相關資料", aliases: ["保費", "年繳保費", "每年保費", "保費表"], group: "基礎資料", priority: 6, type: "text" },
      { key: "entryAge", label: "投保年齡", aliases: ["投保年齡", "投保年齡範圍", "受保年齡", "投保資格"], group: "基礎資料", priority: 7, type: "text" },
      { key: "coverageArea", label: "保障地區", aliases: ["保障地域", "地域保障", "全球", "香港", "澳門"], group: "基礎資料", priority: 8, type: "text" },
      { key: "keyFeatures", label: "主要特色", aliases: ["產品特點", "主要特色", "計劃特點", "特點"], group: "其他保障", priority: 9, type: "text" },
      { key: "riderBenefits", label: "附加保障／權益", aliases: ["附加保障", "附加契約", "自選保障", "額外保障"], group: "附加保障", priority: 10, type: "text" },
      { key: "conditions", label: "條件／限制", aliases: ["重要事項", "注意事項", "條款及細則", "不保事項", "限制"], group: "其他保障", priority: 11, type: "text" },
      { key: "otherImportant", label: "其他重要項目", aliases: ["其他保障", "特別保障", "額外利益"], group: "其他保障", priority: 12, type: "text" }
    ]
  },
  categories: {
    medical: {
      categoryNames: ["醫療"],
      fields: [
        { key: "planStructure", label: "計劃結構", aliases: ["計劃結構", "全數醫療賠償", "分項限額", "基本計劃", "附加契約"], group: "基礎資料", priority: 1, type: "text" },
        { key: "lifetimeLimit", label: "終身保障限額", aliases: ["終身保障限額", "終身限額", "終身賠償限額", "終身最高賠償額"], group: "基礎資料", priority: 2, type: "number" },
        { key: "annualLimit", label: "每年保障限額", aliases: ["每年保障限額", "年度保障限額", "每年賠償限額", "年度最高賠償額"], group: "基礎資料", priority: 3, type: "number" },
        { key: "coverageArea", label: "地域保障範圍", aliases: ["地域保障範圍", "保障地域", "全球保障", "亞洲區保障", "中國內地"], group: "基礎資料", priority: 4, type: "text" },
        { key: "roomType", label: "病房類別", aliases: ["病房類別", "受保病房", "病房級別", "普通房", "半私家房", "標準私家房"], group: "基礎資料", priority: 5, type: "text" },
        { key: "deductible", label: "墊底費", aliases: ["墊底費", "自付費", "免賠額", "自付額"], group: "基礎資料", priority: 6, type: "number" },
        { key: "inpatientBenefit", label: "住院賠償", aliases: ["住院賠償", "住院保障", "住院費用"], group: "主要保障", priority: 7, type: "boolean" },
        { key: "surgeryBenefit", label: "手術費用賠償", aliases: ["手術費用賠償", "外科手術", "手術費"], group: "主要保障", priority: 8, type: "boolean" },
        { key: "postHospitalBenefit", label: "出院後惠益", aliases: ["出院後的惠益", "出院後", "出院后"], group: "主要保障", priority: 9, type: "boolean" },
        { key: "preHospitalBenefit", label: "住院前惠益", aliases: ["住院前的惠益", "住院前", "入院前"], group: "主要保障", priority: 10, type: "boolean" },
        { key: "hospitalCash", label: "住院現金惠益", aliases: ["住院現金惠益", "住院現金"], group: "現金惠益", priority: 11, type: "boolean" },
        { key: "surgeryCash", label: "住院手術現金惠益", aliases: ["住院手術現金惠益", "手術現金惠益"], group: "現金惠益", priority: 12, type: "boolean" },
        { key: "wardCash", label: "次級病房現金惠益", aliases: ["次級病房現金惠益", "病房現金惠益"], group: "現金惠益", priority: 13, type: "boolean" },
        { key: "daySurgeryCash", label: "日間手術現金惠益", aliases: ["日間手術現金惠益", "日間手術"], group: "現金惠益", priority: 14, type: "boolean" },
        { key: "diagnosticImaging", label: "訂明診斷成像檢測", aliases: ["訂明診斷成像檢測", "診斷成像", "影像檢測"], group: "其他保障", priority: 15, type: "boolean" },
        { key: "cancerTreatment", label: "癌症治療費用賠償", aliases: ["癌症治療費用賠償", "癌症治療", "化療", "電療", "標靶"], group: "其他保障", priority: 16, type: "boolean" },
        { key: "dialysisBenefit", label: "透析費用惠益", aliases: ["透析費用惠益", "洗腎", "透析"], group: "其他保障", priority: 17, type: "boolean" },
        { key: "mentalBenefit", label: "精神／神經疾病惠益", aliases: ["精神疾病或神經疾病惠益", "精神疾病", "神經疾病"], group: "其他保障", priority: 18, type: "boolean" },
        { key: "pregnancyBenefit", label: "妊娠併發症惠益", aliases: ["妊娠併發症惠益", "妊娠併發症"], group: "其他保障", priority: 19, type: "boolean" },
        { key: "rehabilitationBenefit", label: "康復惠益", aliases: ["康復惠益", "中風康復", "復康"], group: "其他保障", priority: 20, type: "boolean" },
        { key: "noClaimDiscount", label: "無索償折扣", aliases: ["無索償折扣", "無索償墊底費折扣"], group: "無索償惠益", priority: 21, type: "boolean" },
        { key: "noClaimMedicalCheck", label: "無索償醫療檢查", aliases: ["無索償醫療檢查", "無索償檢查"], group: "無索償惠益", priority: 22, type: "boolean" },
        { key: "noClaimReward", label: "無索償獎賞", aliases: ["無索償獎賞", "無索償回贈"], group: "無索償惠益", priority: 23, type: "boolean" },
        { key: "outpatientRider", label: "門診惠益", aliases: ["自選門診惠益", "附加門診惠益", "門診惠益"], group: "附加保障", priority: 24, type: "boolean" },
        { key: "dentalRider", label: "牙科惠益", aliases: ["牙科惠益", "牙科保障"], group: "附加保障", priority: 25, type: "boolean" },
        { key: "networkBenefit", label: "醫療網絡保障", aliases: ["醫療網絡保障", "指定醫院", "網絡醫生", "網絡保障"], group: "附加保障", priority: 26, type: "boolean" }
      ]
    },
    criticalIllness: {
      categoryNames: ["危疾"],
      fields: [
        { key: "planStructure", label: "計劃結構", aliases: ["基本計劃", "附加契約", "基本計劃／附加契約"], group: "基礎資料", priority: 1, type: "text" },
        { key: "premiumPaymentTerm", label: "保費繳付期", aliases: ["保費繳付期", "繳費期", "每年續保"], group: "基礎資料", priority: 2, type: "text" },
        { key: "participating", label: "分紅保險", aliases: ["分紅保險", "週年紅利", "終期分紅"], group: "基礎資料", priority: 3, type: "boolean" },
        { key: "majorClaims", label: "嚴重疾病賠償次數", aliases: ["單次危疾賠償", "多重危疾賠償", "嚴重疾病賠償"], group: "主要保障", priority: 4, type: "text" },
        { key: "majorIllnessCount", label: "嚴重疾病數目", aliases: ["嚴重疾病", "受保嚴重疾病"], group: "主要保障", priority: 5, type: "number" },
        { key: "minorIllnessCount", label: "非嚴重疾病數目", aliases: ["非嚴重疾病", "早期危疾"], group: "主要保障", priority: 6, type: "number" },
        { key: "earlyStageBenefit", label: "早期危疾保障", aliases: ["早期危疾", "早期疾病"], group: "主要保障", priority: 7, type: "boolean" },
        { key: "childDiseaseBenefit", label: "嚴重兒童疾病保障", aliases: ["嚴重兒童疾病", "兒童疾病"], group: "主要保障", priority: 8, type: "boolean" },
        { key: "cancerBenefit", label: "癌症保障", aliases: ["癌症", "癌症保障", "癌症治療"], group: "其他保障", priority: 9, type: "boolean" },
        { key: "claimLimit", label: "最高賠償限額", aliases: ["最高賠償", "最高保障", "賠償限額"], group: "其他保障", priority: 10, type: "number" },
        { key: "grandfatherClause", label: "原狀危疾條款", aliases: ["原狀危疾條款", "原狀條款"], group: "其他保障", priority: 11, type: "boolean" },
        { key: "riderOptions", label: "可選附加保障", aliases: ["可選附加", "附加保障", "附加契約"], group: "附加保障", priority: 12, type: "text" }
      ]
    },
    personalAccident: {
      categoryNames: ["個人意外"],
      fields: [
        { key: "planStructure", label: "計劃結構", aliases: ["基本計劃", "附加契約", "每年續保"], group: "基礎資料", priority: 1, type: "text" },
        { key: "premiumPaymentTerm", label: "保費繳付期／保障期", aliases: ["保費繳付期", "保障期", "每年續保"], group: "基礎資料", priority: 2, type: "text" },
        { key: "accidentalDeath", label: "意外死亡及斷肢賠償", aliases: ["意外死亡及斷肢", "意外死亡賠償", "意外死亡"], group: "主要保障", priority: 3, type: "boolean" },
        { key: "permanentTotalDisability", label: "永久完全殘廢賠償", aliases: ["永久完全殘廢", "永久殘廢"], group: "主要保障", priority: 4, type: "boolean" },
        { key: "dailyLivingLoss", label: "失去日常生活活動能力賠償", aliases: ["失去日常生活活動能力", "日常生活活動能力"], group: "主要保障", priority: 5, type: "boolean" },
        { key: "doubleIndemnity", label: "雙倍利益賠償", aliases: ["雙倍利益賠償", "雙倍賠償"], group: "主要保障", priority: 6, type: "boolean" },
        { key: "accidentalMedical", label: "意外醫療費用賠償", aliases: ["意外醫療費用賠償", "意外醫療"], group: "其他保障", priority: 7, type: "boolean" },
        { key: "brokenBoneCash", label: "骨折賠償", aliases: ["骨折賠償", "骨折及嚴重受傷賠償"], group: "現金惠益", priority: 8, type: "boolean" },
        { key: "hospitalCash", label: "意外住院現金賠償", aliases: ["意外住院現金賠償", "住院現金賠償"], group: "現金惠益", priority: 9, type: "boolean" },
        { key: "icuCash", label: "深切治療賠償", aliases: ["深切治療賠償", "ICU Cash"], group: "現金惠益", priority: 10, type: "boolean" },
        { key: "medicalAppliance", label: "醫療器材津貼", aliases: ["醫療器材津貼", "醫療器材"], group: "其他保障", priority: 11, type: "boolean" },
        { key: "optionalBenefits", label: "自選保障", aliases: ["自選", "Optional", "自選保障"], group: "附加保障", priority: 12, type: "text" }
      ]
    }
  }
};
