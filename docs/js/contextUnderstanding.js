// ======================================
// Health Pilot
// Context Understanding Layer v1
// ======================================

(function (root, factory) {
  const contextUnderstanding = factory();

  if (typeof module !== "undefined" && module.exports) {
    module.exports = contextUnderstanding;
  }

  root.ContextUnderstanding = contextUnderstanding;
})(typeof window !== "undefined" ? window : globalThis, function () {
  const DEFAULT_OUTPUT = {
    physical: {
      pain: false,
      painAreas: [],
      fatigue: false,
      headache: false,
      coldSymptoms: false
    },
    work: {
      workload: "normal",
      importantEvent: false,
      eventType: "none",
      overtimeRisk: false,
      businessTrip: false,
      deadlineRisk: false
    },
    mental: {
      stressRisk: "low",
      motivation: "unknown",
      stressed: false,
      anxious: false,
      calm: false
    },
    personal: {
      familyEvent: false,
      childCare: false,
      travel: false
    },
    constraints: [],
    priorities: []
  };

  function normalizeDailyContext(input) {
    const source = input && typeof input === "object" ? input : {};

    return {
      category: typeof source.category === "string" ? source.category.trim().toLowerCase() : "",
      note: typeof source.note === "string" ? source.note.trim() : "",
      date: typeof source.date === "string" ? source.date : ""
    };
  }

  function hasAny(text, patterns) {
    return patterns.some(function (pattern) {
      return pattern.test(text);
    });
  }

  function uniqueStrings(values) {
    return Array.from(new Set(values.filter(function (value) {
      return typeof value === "string" && value.trim();
    })));
  }

  function buildOutput() {
    return {
      physical: {
        pain: false,
        painAreas: [],
        fatigue: false,
        headache: false,
        coldSymptoms: false
      },
      work: {
        workload: "normal",
        importantEvent: false,
        eventType: "none",
        overtimeRisk: false,
        businessTrip: false,
        deadlineRisk: false
      },
      mental: {
        stressRisk: "low",
        motivation: "unknown",
        stressed: false,
        anxious: false,
        calm: false
      },
      personal: {
        familyEvent: false,
        childCare: false,
        travel: false
      },
      constraints: [],
      priorities: []
    };
  }

  function analyzeContext(input) {
    const dailyContext = normalizeDailyContext(input);
    const text = [dailyContext.category, dailyContext.note]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    if (!text) {
      return buildOutput();
    }

    const output = buildOutput();

    const hasPainWord = hasAny(text, [/(^|\s)(pain|hurts?|hurt|ache|aching|injury|sore|soreness)\b/i, /痛(い|み)?/, /疼痛/]);
    const hasAnkle = hasAny(text, [/\bankle\b/i, /足首/]);
    const hasHeadache = hasAny(text, [/\bheadache\b/i, /頭痛/]);

    if (hasAnkle && (hasPainWord || /ankle\s*(is\s*)?(painful|hurts?)/i.test(text) || /足首.*痛/.test(text))) {
      output.physical.pain = true;
      output.physical.painAreas.push("ankle");
    }

    if (hasHeadache) {
      output.physical.headache = true;
      output.physical.pain = true;
      output.physical.painAreas.push("head");
    }

    if (hasAny(text, [/\bfatigue\b/i, /\btired\b/i, /\bexhaust(ed|ion)?\b/i, /疲れ/, /疲労/, /だるい/, /しんどい/])) {
      output.physical.fatigue = true;
    }

    if (hasAny(text, [/\bcold\b/i, /\bcough\b/i, /\bfever\b/i, /\brunny\s*nose\b/i, /\bsore\s*throat\b/i, /風邪/, /咳/, /熱/, /鼻水/, /喉/])) {
      output.physical.coldSymptoms = true;
    }

    if (hasAny(text, [/\bpresentation\b/i, /プレゼン/, /発表/])) {
      output.work.importantEvent = true;
      output.work.eventType = "presentation";
    }

    if (hasAny(text, [/\bdeadline\b/i, /締切/, /〆切/, /納期/])) {
      output.work.deadlineRisk = true;
      output.work.workload = "high";
      if (output.work.eventType === "none") {
        output.work.eventType = "deadline";
      }
    }

    if (hasAny(text, [/\bovertime\b/i, /working\s*late/i, /late\s*tonight/i, /long\s*day/i, /extended\s*hours/i, /残業/, /遅くまで/])) {
      output.work.overtimeRisk = true;
      output.work.workload = "high";
    }

    if (hasAny(text, [/\bbusy\b/i, /\bheavy\s*workload\b/i, /workload\s*is\s*high/i, /多忙/, /忙しい/, /立て込/])) {
      output.work.workload = "high";
    }

    if (hasAny(text, [/\bbusiness\s*trip\b/i, /出張/])) {
      output.work.businessTrip = true;
    }

    if (hasAny(text, [/\bstress(ed)?\b/i, /ストレス/, /不安/, /焦り/, /プレッシャー/])) {
      output.mental.stressed = true;
    }

    if (hasAny(text, [/\banxious\b/i, /\bnervous\b/i, /不安/, /緊張/])) {
      output.mental.anxious = true;
    }

    if (hasAny(text, [/\bmotivated\b/i, /\bmotivation\b/i, /\benergized\b/i, /やる気/, /モチベーション/])) {
      output.mental.motivation = "high";
    }

    if (hasAny(text, [/\bcalm\b/i, /\brelaxed\b/i, /落ち着/, /穏やか/])) {
      output.mental.calm = true;
    }

    if (hasAny(text, [/\bfamily\s*event\b/i, /家族(行事|イベント)?/, /親戚/])) {
      output.personal.familyEvent = true;
    }

    if (hasAny(text, [/\bchild\s*care\b/i, /\bchildcare\b/i, /育児/, /子ども/, /子供/])) {
      output.personal.childCare = true;
    }

    if (hasAny(text, [/\btravel\b/i, /\btrip\b/i, /旅行/, /移動/])) {
      output.personal.travel = true;
    }

    if (output.mental.stressed || output.mental.anxious || output.work.importantEvent || output.work.deadlineRisk) {
      output.mental.stressRisk = "medium";
    }

    if ((output.mental.stressed && output.mental.anxious)
      || (output.work.workload === "high" && output.work.overtimeRisk)) {
      output.mental.stressRisk = "high";
    }

    if (output.mental.calm && !output.mental.stressed && !output.mental.anxious) {
      output.mental.stressRisk = "low";
    }

    if (output.physical.pain) {
      output.constraints.push("avoid_high_intensity_activity");
      output.priorities.push("focus_protection");
    }

    if (output.physical.fatigue || output.physical.coldSymptoms || output.work.overtimeRisk || output.work.workload === "high") {
      output.priorities.push("recovery_support");
    }

    if (output.work.importantEvent || output.work.deadlineRisk) {
      output.priorities.push("focus_protection");
    }

    output.physical.painAreas = uniqueStrings(output.physical.painAreas);
    output.constraints = uniqueStrings(output.constraints);
    output.priorities = uniqueStrings(output.priorities);

    return output;
  }

  return {
    DEFAULT_OUTPUT,
    analyzeContext
  };
});

console.log("Context Understanding loaded");
