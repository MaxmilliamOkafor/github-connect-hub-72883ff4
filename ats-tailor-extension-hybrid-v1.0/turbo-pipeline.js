// turbo-pipeline.js - LAZYAPPLY 3X ULTRA-FAST Pipeline (≤175ms total)
// 50% FASTER: 350ms → 175ms for LazyApply 3X speed compatibility
// FEATURES: URL-based caching, parallel processing, High Priority keyword distribution, Unique CV per job

(function(global) {
  'use strict';

  // ============ TIMING TARGETS (175ms TOTAL - LAZYAPPLY 3X SPEED) ============
  const TIMING_TARGETS = {
    EXTRACT_KEYWORDS: 30,     // 30ms (cached: instant) - was 50ms
    TAILOR_CV: 50,            // 50ms - was 100ms
    GENERATE_PDF: 62,         // 62ms - was 100ms
    ATTACH_FILES: 33,         // 33ms - was 50ms
    TOTAL: 175                // 175ms total - was 350ms
  };

  // ============ FAST KEYWORD CACHE (URL-BASED) ============
  const keywordCache = new Map();
  const MAX_CACHE_SIZE = 100;
  const CACHE_EXPIRY_MS = 30 * 60 * 1000; // 30 minutes

  function getCacheKey(jobUrl, text) {
    // Primary: Use job URL for instant cache hits
    if (jobUrl) return jobUrl;
    // Fallback: Hash of first 200 chars + length
    return text.substring(0, 200) + '_' + text.length;
  }

  function getCachedKeywords(jobUrl, text) {
    const key = getCacheKey(jobUrl, text);
    const cached = keywordCache.get(key);
    if (cached && (Date.now() - cached.timestamp) < CACHE_EXPIRY_MS) {
      console.log('[TurboPipeline] ⚡ Cache HIT for:', key.substring(0, 50));
      return cached.keywords;
    }
    return null;
  }

  function setCachedKeywords(jobUrl, text, keywords) {
    const key = getCacheKey(jobUrl, text);
    if (keywordCache.size >= MAX_CACHE_SIZE) {
      const firstKey = keywordCache.keys().next().value;
      keywordCache.delete(firstKey);
    }
    keywordCache.set(key, { keywords, timestamp: Date.now() });
  }

  // ============ TURBO KEYWORD EXTRACTION (≤50ms, instant if cached) ============
  async function turboExtractKeywords(jobDescription, options = {}) {
    const startTime = performance.now();
    const { jobUrl = '', maxKeywords = 35 } = options;
    
    if (!jobDescription || jobDescription.length < 50) {
      return { all: [], highPriority: [], mediumPriority: [], lowPriority: [], workExperience: [], total: 0, timing: 0 };
    }

    // CHECK CACHE FIRST (instant return)
    const cached = getCachedKeywords(jobUrl, jobDescription);
    if (cached) {
      return { ...cached, timing: performance.now() - startTime, fromCache: true };
    }

    // Ultra-fast synchronous extraction
    const result = ultraFastExtraction(jobDescription, maxKeywords);

    // Cache result
    setCachedKeywords(jobUrl, jobDescription, result);

    const timing = performance.now() - startTime;
    console.log(`[TurboPipeline] Keywords extracted in ${timing.toFixed(0)}ms (target: ${TIMING_TARGETS.EXTRACT_KEYWORDS}ms)`);
    
    return { ...result, timing, fromCache: false };
  }

  // ============ ULTRA-FAST EXTRACTION (TECHNICAL KEYWORDS ONLY) ============
  function ultraFastExtraction(text, maxKeywords) {
    const stopWords = new Set([
      'a','an','the','and','or','but','in','on','at','to','for','of','with','by','from',
      'as','is','was','are','were','been','be','have','has','had','do','does','did',
      'will','would','could','should','may','might','must','can','need','this','that',
      'you','your','we','our','they','their','work','working','job','position','role',
      'team','company','opportunity','looking','seeking','required','requirements',
      'preferred','ability','able','experience','years','year','including','new',
      'strong','excellent','highly','etc','also','via','across','ensure','join'
    ]);

    // EXCLUDE soft skills - these look unprofessional when injected
    const softSkillsToExclude = new Set([
      'collaboration','communication','teamwork','leadership','initiative','proactive',
      'ownership','responsibility','commitment','passion','dedication','motivation',
      'self-starter','detail-oriented','problem-solving','critical thinking',
      'time management','adaptability','flexibility','creativity','innovation',
      'interpersonal','organizational','multitasking','prioritization','reliability',
      'accountability','integrity','professionalism','work ethic','positive attitude',
      'enthusiasm','driven','dynamic','results-oriented','goal-oriented','mission',
      'continuous learning','debugging','testing','documentation','system integration',
      'goodjob','sidekiq','canvas','salesforce'
    ]);

    // Technical/hard skills patterns (boosted)
    const technicalPatterns = new Set([
      'python','java','javascript','typescript','ruby','rails','react','node','nodejs',
      'aws','azure','gcp','google cloud','kubernetes','docker','terraform','ansible',
      'postgresql','postgres','mysql','mongodb','redis','elasticsearch','bigquery',
      'spark','airflow','kafka','dbt','snowflake','databricks','mlops','devops',
      'ci/cd','github','gitlab','jenkins','circleci','agile','scrum','jira','confluence',
      'pytorch','tensorflow','scikit-learn','pandas','numpy','sql','nosql','graphql',
      'rest','api','microservices','serverless','lambda','ecs','eks','s3','rds',
      'machine learning','data science','data engineering','deep learning','nlp','llm',
      'genai','ai','ml','computer vision','data pipelines','etl','data modeling',
      'tableau','power bi','looker','heroku','vercel','netlify','linux','unix','bash',
      'git','svn','html','css','sass','webpack','vite','nextjs','vue','angular',
      'swift','kotlin','flutter','react native','ios','android','mobile','frontend',
      'backend','fullstack','full-stack','sre','infrastructure','networking','security',
      'oauth','jwt','encryption','compliance','gdpr','hipaa','soc2','pci','prince2',
      'cbap','pmp','certified','certification','.net','c#','go','scala'
    ]);

    const words = text.toLowerCase()
      .replace(/[^a-z0-9\s\-\/\.#\+]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length >= 2 && !stopWords.has(w) && !softSkillsToExclude.has(w));

    // Single-pass frequency count with tech boost
    const freq = new Map();
    words.forEach(word => {
      if (technicalPatterns.has(word) || word.length > 4) {
        const count = (freq.get(word) || 0) + 1;
        const boost = technicalPatterns.has(word) ? 5 : 1;
        freq.set(word, count * boost);
      }
    });

    // Multi-word technical phrases
    const multiWordPatterns = [
      'project management', 'data science', 'machine learning', 'deep learning',
      'data engineering', 'cloud platform', 'google cloud platform', 'agile/scrum',
      'a/b testing', 'ci/cd', 'real-time', 'data pipelines', 'ruby on rails',
      'node.js', 'react.js', 'vue.js', 'next.js', 'full stack', 'full-stack',
      'natural language processing', 'computer vision', 'artificial intelligence',
      '.net core', 'software development', 'full-stack development'
    ];
    
    const textLower = text.toLowerCase();
    multiWordPatterns.forEach(phrase => {
      if (textLower.includes(phrase)) {
        freq.set(phrase, (freq.get(phrase) || 0) + 10);
      }
    });

    // Sort and split into priority buckets
    const sorted = [...freq.entries()]
      .filter(([word]) => !softSkillsToExclude.has(word))
      .sort((a, b) => b[1] - a[1])
      .map(([word]) => word)
      .slice(0, maxKeywords);

    const highCount = Math.min(15, Math.ceil(sorted.length * 0.45));
    const medCount = Math.min(10, Math.ceil(sorted.length * 0.35));

    return {
      all: sorted,
      highPriority: sorted.slice(0, highCount),
      mediumPriority: sorted.slice(highCount, highCount + medCount),
      lowPriority: sorted.slice(highCount + medCount),
      workExperience: sorted.slice(0, 15), // Top 15 for WE injection
      total: sorted.length
    };
  }

  // ============ HIGH PRIORITY KEYWORD DISTRIBUTION (ALL KEYWORDS) ============
  // CRITICAL FIX: Inject ALL extracted keywords naturally into Work Experience bullets
  // Strategy: Distribute evenly across ALL bullets, create new bullets if needed
  function distributeHighPriorityKeywords(cvText, allKeywords, options = {}) {
    const startTime = performance.now();
    const { maxBulletsPerRole = 10, maxKeywordsPerBullet = 3 } = options;
    
    if (!cvText || !allKeywords?.length) {
      return { tailoredCV: cvText, distributionStats: {}, timing: 0 };
    }

    let tailoredCV = cvText;
    const cvLower = cvText.toLowerCase();
    const stats = { total: allKeywords.length, alreadyPresent: 0, added: 0, missing: 0 };
    
    // Separate keywords: already in CV vs missing
    const missingKeywords = [];
    const presentKeywords = [];
    
    allKeywords.forEach(kw => {
      const regex = new RegExp(`\\b${kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
      if (regex.test(cvLower)) {
        presentKeywords.push(kw);
        stats.alreadyPresent++;
      } else {
        missingKeywords.push(kw);
      }
    });
    
    console.log(`[TurboPipeline] Keywords: ${presentKeywords.length} present, ${missingKeywords.length} missing`);

    if (missingKeywords.length === 0) {
      return { tailoredCV, distributionStats: stats, timing: performance.now() - startTime };
    }

    // Find Work Experience section boundaries
    const expMatch = /\n(EXPERIENCE|WORK\s*EXPERIENCE|EMPLOYMENT|PROFESSIONAL\s*EXPERIENCE)[\s:]*\n/im.exec(tailoredCV);
    if (!expMatch) {
      console.log('[TurboPipeline] No experience section found');
      stats.missing = missingKeywords.length;
      return { tailoredCV, distributionStats: stats, timing: performance.now() - startTime };
    }

    const expStart = expMatch.index + expMatch[0].length;
    const afterExp = tailoredCV.substring(expStart);
    const nextSectionMatch = /\n(SKILLS|EDUCATION|CERTIFICATIONS|PROJECTS|TECHNICAL\s*PROFICIENCIES)[\s:]*\n/im.exec(afterExp);
    const expEnd = nextSectionMatch ? expStart + nextSectionMatch.index : tailoredCV.length;
    
    let experienceSection = tailoredCV.substring(expStart, expEnd);
    
    // Natural injection phrases (varied for authenticity)
    const phrases = [
      'leveraging', 'utilizing', 'implementing', 'applying', 'with expertise in',
      'through', 'incorporating', 'employing', 'using', 'via'
    ];
    const getPhrase = () => phrases[Math.floor(Math.random() * phrases.length)];

    // Split into lines and count bullets
    const lines = experienceSection.split('\n');
    const bulletLines = [];
    
    for (let i = 0; i < lines.length; i++) {
      const trimmed = lines[i].trim();
      if (/^[-•*▪▸]\s/.test(trimmed)) {
        bulletLines.push(i);
      }
    }
    
    if (bulletLines.length === 0) {
      stats.missing = missingKeywords.length;
      return { tailoredCV, distributionStats: stats, timing: performance.now() - startTime };
    }

    // Calculate keywords per bullet for even distribution
    const keywordsPerBullet = Math.ceil(missingKeywords.length / bulletLines.length);
    let keywordIndex = 0;
    
    // Modify each bullet to inject keywords
    for (let i = 0; i < bulletLines.length && keywordIndex < missingKeywords.length; i++) {
      const lineIdx = bulletLines[i];
      let line = lines[lineIdx];
      
      // Get keywords for this bullet (2-3 max per bullet)
      const numToAdd = Math.min(maxKeywordsPerBullet, keywordsPerBullet, missingKeywords.length - keywordIndex);
      const kwsToAdd = missingKeywords.slice(keywordIndex, keywordIndex + numToAdd);
      keywordIndex += numToAdd;
      
      if (kwsToAdd.length === 0) continue;
      
      // Inject keywords naturally
      const phrase = getPhrase();
      let injection = '';
      
      if (kwsToAdd.length === 1) {
        injection = `, ${phrase} ${kwsToAdd[0]}`;
      } else if (kwsToAdd.length === 2) {
        injection = ` ${phrase} ${kwsToAdd[0]} and ${kwsToAdd[1]}`;
      } else {
        injection = ` ${phrase} ${kwsToAdd.slice(0, -1).join(', ')}, and ${kwsToAdd.slice(-1)}`;
      }
      
      if (line.endsWith('.')) {
        line = line.slice(0, -1) + injection + '.';
      } else {
        line = line.trimEnd() + injection;
      }
      
      lines[lineIdx] = line;
      stats.added += kwsToAdd.length;
    }

    // If we still have keywords left, add new contextual bullets
    if (keywordIndex < missingKeywords.length) {
      const remaining = missingKeywords.slice(keywordIndex);
      const newBullets = [];
      
      // Create bullets with 3 keywords each
      for (let i = 0; i < remaining.length; i += 3) {
        const chunk = remaining.slice(i, i + 3);
        const phrase = getPhrase();
        if (chunk.length === 1) {
          newBullets.push(`• Implemented ${chunk[0]} solutions to enhance operational efficiency and delivery outcomes`);
        } else if (chunk.length === 2) {
          newBullets.push(`• Applied ${chunk[0]} and ${chunk[1]} methodologies to drive cross-functional improvements`);
        } else {
          newBullets.push(`• Delivered ${chunk.slice(0, -1).join(', ')}, and ${chunk.slice(-1)} initiatives across technical teams`);
        }
        stats.added += chunk.length;
      }
      
      // Insert new bullets after first role's existing bullets
      if (bulletLines.length > 0 && newBullets.length > 0) {
        const insertAfter = bulletLines[Math.min(4, bulletLines.length - 1)];
        lines.splice(insertAfter + 1, 0, ...newBullets);
      }
    }

    experienceSection = lines.join('\n');
    tailoredCV = tailoredCV.substring(0, expStart) + experienceSection + tailoredCV.substring(expEnd);
    
    stats.missing = Math.max(0, missingKeywords.length - stats.added);

    const timing = performance.now() - startTime;
    console.log(`[TurboPipeline] Keyword distribution: ${stats.added} added, ${stats.alreadyPresent} already present, ${stats.missing} still missing (${timing.toFixed(0)}ms)`);
    
    return { tailoredCV, distributionStats: stats, timing };
  }

  // ============ TURBO CV TAILORING (≤50ms - LAZYAPPLY 3X) ============
  async function turboTailorCV(cvText, keywords, options = {}) {
    const startTime = performance.now();
    
    if (!cvText || !keywords?.all?.length) {
      return { tailoredCV: cvText, injectedKeywords: [], timing: 0, stats: {}, uniqueHash: '' };
    }

    // USE UNIQUE CV ENGINE if available (preserves companies/roles/dates, modifies bullets only)
    if (global.UniqueCVEngine?.generateUniqueCVForJob) {
      const uniqueResult = global.UniqueCVEngine.generateUniqueCVForJob(cvText, keywords.highPriority || keywords.all.slice(0, 15));
      const timing = performance.now() - startTime;
      console.log(`[TurboPipeline] Unique CV generated in ${timing.toFixed(0)}ms (target: ${TIMING_TARGETS.TAILOR_CV}ms)`);
      return {
        tailoredCV: uniqueResult.uniqueCV,
        originalCV: cvText,
        injectedKeywords: [],
        stats: uniqueResult.stats,
        timing,
        uniqueHash: uniqueResult.fileHash
      };
    }

    // FALLBACK: Basic keyword injection (Work Experience focus)
    const cvLower = cvText.toLowerCase();
    const missing = (keywords.workExperience || keywords.all.slice(0, 15))
      .filter(kw => !cvLower.includes(kw.toLowerCase()));
    
    let tailoredCV = cvText;
    let injected = [];

    if (missing.length > 0) {
      const result = fastTailorWorkExperience(cvText, missing);
      tailoredCV = result.tailoredCV;
      injected = result.injectedKeywords;
    }

    // DISTRIBUTE ALL KEYWORDS (not just high priority)
    // Combine all keyword categories for full injection
    const allKeywordsToInject = [
      ...(keywords.highPriority || []),
      ...(keywords.mediumPriority || []),
      ...(keywords.lowPriority || []),
      ...(keywords.workExperience || [])
    ].filter((kw, idx, arr) => arr.indexOf(kw) === idx); // Deduplicate
    
    if (allKeywordsToInject.length > 0) {
      const distResult = distributeHighPriorityKeywords(tailoredCV, allKeywordsToInject, {
        maxBulletsPerRole: 10,
        maxKeywordsPerBullet: 3
      });
      tailoredCV = distResult.tailoredCV;
      injected.push(...(distResult.distributionStats?.added ? allKeywordsToInject.slice(0, distResult.distributionStats.added) : []));
    }

    const timing = performance.now() - startTime;
    console.log(`[TurboPipeline] CV tailored in ${timing.toFixed(0)}ms (target: ${TIMING_TARGETS.TAILOR_CV}ms)`);
    
    return { 
      tailoredCV, 
      originalCV: cvText,
      injectedKeywords: injected,
      stats: { total: injected.length, workExperience: injected.length, skills: 0 },
      timing,
      uniqueHash: ''
    };
  }

  // ============ FAST WORK EXPERIENCE TAILORING ============
  function fastTailorWorkExperience(cvText, missingKeywords) {
    let tailoredCV = cvText;
    const injected = [];

    const expMatch = /^(EXPERIENCE|WORK\s*EXPERIENCE|EMPLOYMENT|PROFESSIONAL\s*EXPERIENCE)[\s:]*$/im.exec(tailoredCV);
    if (!expMatch) return { tailoredCV, injectedKeywords: [] };

    const expStart = expMatch.index + expMatch[0].length;
    const nextSectionMatch = /^(SKILLS|EDUCATION|CERTIFICATIONS|PROJECTS)[\s:]*$/im.exec(tailoredCV.substring(expStart));
    const expEnd = nextSectionMatch ? expStart + nextSectionMatch.index : tailoredCV.length;
    
    let experienceSection = tailoredCV.substring(expStart, expEnd);
    const lines = experienceSection.split('\n');
    let keywordIndex = 0;
    
    const patterns = [
      ', incorporating {} principles',
      ' with focus on {}',
      ', leveraging {}',
      ' utilizing {} methodologies',
      ' through {} implementation'
    ];

    const modifiedLines = lines.map(line => {
      const trimmed = line.trim();
      if (!(trimmed.startsWith('-') || trimmed.startsWith('•') || trimmed.startsWith('*'))) {
        return line;
      }
      if (keywordIndex >= missingKeywords.length) return line;

      // Inject 2-3 keywords per bullet
      const toInject = [];
      while (toInject.length < 3 && keywordIndex < missingKeywords.length) {
        const kw = missingKeywords[keywordIndex];
        if (!line.toLowerCase().includes(kw.toLowerCase())) {
          toInject.push(kw);
        }
        keywordIndex++;
      }
      
      if (toInject.length === 0) return line;

      const pattern = patterns[Math.floor(Math.random() * patterns.length)];
      let bulletContent = trimmed.replace(/^[-•*]\s*/, '');
      
      const injection = toInject.length === 1 
        ? pattern.replace('{}', toInject[0])
        : pattern.replace('{}', toInject.slice(0, -1).join(', ') + ' and ' + toInject.slice(-1));
      
      if (bulletContent.endsWith('.')) {
        bulletContent = bulletContent.slice(0, -1) + injection + '.';
      } else {
        bulletContent = bulletContent + injection;
      }
      
      injected.push(...toInject);
      return `- ${bulletContent}`;
    });

    const modifiedExperience = modifiedLines.join('\n');
    tailoredCV = tailoredCV.substring(0, expStart) + modifiedExperience + tailoredCV.substring(expEnd);

    return { tailoredCV, injectedKeywords: injected };
  }

  // ============ COMPLETE TURBO PIPELINE (≤175ms total - LAZYAPPLY 3X) ============
  async function executeTurboPipeline(jobInfo, candidateData, baseCV, options = {}) {
    const pipelineStart = performance.now();
    const timings = {};
    
    console.log('[TurboPipeline] ⚡ Starting 175ms LAZYAPPLY 3X pipeline for:', jobInfo?.title || 'Unknown Job');
    
    // PHASE 1: Extract keywords (≤50ms, INSTANT if cached)
    const extractStart = performance.now();
    const jdText = jobInfo?.description || '';
    const keywordsResult = await turboExtractKeywords(jdText, {
      jobUrl: jobInfo?.url || '',
      maxKeywords: options.maxKeywords || 35
    });
    timings.extraction = performance.now() - extractStart;

    if (!keywordsResult.all?.length) {
      console.warn('[TurboPipeline] No keywords extracted');
      return { success: false, error: 'No keywords extracted', timings };
    }

    // PHASE 2: Tailor CV with High Priority distribution (≤100ms)
    const tailorStart = performance.now();
    const tailorResult = await turboTailorCV(baseCV, keywordsResult, { 
      targetScore: options.targetScore || 95 
    });
    timings.tailoring = performance.now() - tailorStart;

    // PHASE 3: High Priority Keyword Distribution (3-5x mentions)
    const distStart = performance.now();
    let finalCV = tailorResult.tailoredCV;
    let distributionStats = {};
    
    if (keywordsResult.highPriority?.length > 0) {
      const distResult = distributeHighPriorityKeywords(finalCV, keywordsResult.highPriority, {
        maxBulletsPerRole: 8,
        targetMentions: 4,
        minMentions: 3,
        maxMentions: 5
      });
      finalCV = distResult.tailoredCV;
      distributionStats = distResult.distributionStats;
    }
    timings.distribution = performance.now() - distStart;

    // PDF + Attach handled by pdf-ats-turbo.js and file-attacher.js

    const totalTime = performance.now() - pipelineStart;
    timings.total = totalTime;

    console.log(`[TurboPipeline] ⏱️ TURBO Timing breakdown:
      Extraction: ${timings.extraction.toFixed(0)}ms ${keywordsResult.fromCache ? '(CACHED)' : ''}
      Tailoring: ${timings.tailoring.toFixed(0)}ms
      Distribution: ${timings.distribution.toFixed(0)}ms
      Total: ${totalTime.toFixed(0)}ms (target: ${TIMING_TARGETS.TOTAL}ms)`);

    return {
      success: true,
      keywords: keywordsResult,
      workExperienceKeywords: keywordsResult.workExperience,
      tailoredCV: finalCV,
      injectedKeywords: tailorResult.injectedKeywords,
      distributionStats,
      stats: tailorResult.stats,
      timings,
      fromCache: keywordsResult.fromCache,
      meetsTarget: totalTime <= TIMING_TARGETS.TOTAL
    };
  }

  // ============ EXPORTS ============
  global.TurboPipeline = {
    executeTurboPipeline,
    turboExtractKeywords,
    turboTailorCV,
    distributeHighPriorityKeywords,
    TIMING_TARGETS,
    clearCache: () => keywordCache.clear(),
    getCacheSize: () => keywordCache.size
  };

})(typeof window !== 'undefined' ? window : global);
