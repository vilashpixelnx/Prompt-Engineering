AOS.init({
      duration: 700,
      once: true,
      offset: 70
    });

    const lenis = typeof Lenis !== "undefined"
      ? new Lenis({
          duration: 1.05,
          smoothWheel: true,
          wheelMultiplier: 0.9,
          touchMultiplier: 1.1
        })
      : null;

    if (lenis) {
      function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
      }

      requestAnimationFrame(raf);
    }

    const header = document.getElementById("siteHeader");
    const themeToggle = document.getElementById("themeToggle");
    const toggle = document.getElementById("menuToggle");
    const navLinks = document.getElementById("navLinks");
    const navAnchorLinks = navLinks.querySelectorAll("a[href^='#']");
    const backToTop = document.getElementById("backToTop");
    const labTabs = document.querySelectorAll(".lab-tab");
    const labPanels = document.querySelectorAll(".lab-panel");
    const body = document.body;

    function applyTheme(theme) {
      const isDark = theme === "dark";
      body.classList.toggle("dark-theme", isDark);
      themeToggle.innerHTML = isDark
        ? '<i class="fa-solid fa-sun"></i>'
        : '<i class="fa-solid fa-moon"></i>';
      themeToggle.setAttribute("aria-label", isDark ? "Switch to light mode" : "Switch to dark mode");
    }

    const savedTheme = localStorage.getItem("promptai-theme");
    applyTheme(savedTheme === "dark" ? "dark" : "light");

    themeToggle.addEventListener("click", () => {
      const nextTheme = body.classList.contains("dark-theme") ? "light" : "dark";
      localStorage.setItem("promptai-theme", nextTheme);
      applyTheme(nextTheme);
    });

    window.addEventListener("scroll", () => {
      header.classList.toggle("scrolled", window.scrollY > 10);
      backToTop.classList.toggle("visible", window.scrollY > 420);
    });

    toggle.addEventListener("click", () => {
      navLinks.classList.toggle("open");
    });

    function setActiveNavLink(targetId) {
      navAnchorLinks.forEach((link) => {
        link.classList.toggle("active", link.getAttribute("href") === targetId);
      });
    }

    navLinks.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        navLinks.classList.remove("open");
      });
    });

    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener("click", (event) => {
        const targetId = anchor.getAttribute("href");
        if (!targetId || targetId === "#") return;

        const target = document.querySelector(targetId);
        if (!target) return;

        event.preventDefault();
        navLinks.classList.remove("open");
        setActiveNavLink(targetId);

        if (lenis) {
          lenis.scrollTo(target, {
            offset: -18,
            duration: 1.05
          });
        } else {
          target.scrollIntoView({
            behavior: "smooth",
            block: "start"
          });
        }
      });
    });

    const sections = document.querySelectorAll("main section[id], footer[id]");

    function syncActiveNavOnScroll() {
      const scrollPosition = window.scrollY + 140;
      let currentId = "#home";

      sections.forEach((section) => {
        if (scrollPosition >= section.offsetTop) {
          currentId = `#${section.id}`;
        }
      });

      setActiveNavLink(currentId);
    }

    syncActiveNavOnScroll();
    window.addEventListener("scroll", syncActiveNavOnScroll);

    backToTop.addEventListener("click", () => {
      if (lenis) {
        lenis.scrollTo(0, {
          duration: 1
        });
      } else {
        window.scrollTo({
          top: 0,
          behavior: "smooth"
        });
      }
    });

    labTabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        labTabs.forEach((item) => item.classList.remove("active"));
        labPanels.forEach((panel) => panel.classList.remove("active"));
        tab.classList.add("active");
        document.getElementById(`panel-${tab.dataset.panel}`).classList.add("active");
      });
    });

    function scorePrompt(text) {
      const clean = text.trim();
      const words = clean.split(/\s+/).filter(Boolean);
      const length = words.length;
      let specificity = 0;
      let clarity = 0;
      let structure = 0;

      if (length > 5) specificity += 20;
      if (length > 14) specificity += 20;
      if (length > 28) specificity += 15;
      if (/\b(for|audience|students|developers|beginners|children)\b/i.test(clean)) specificity += 15;
      if (/\b(in|under|with|using|exactly|only|limit|bullet|steps|table|json)\b/i.test(clean)) specificity += 15;
      if (/\d+/.test(clean)) specificity += 15;

      if (/^(write|explain|list|compare|describe|summarize|create|analyze|generate|give)\b/i.test(clean)) clarity += 30;
      if (length >= 8) clarity += 20;
      if (/[.,:]/.test(clean)) clarity += 20;
      if (clean[0] && clean[0] === clean[0].toUpperCase()) clarity += 10;
      if (/\b(simple|clear|brief|detailed|professional)\b/i.test(clean)) clarity += 20;

      if (/\b(you are|act as|as a|as an)\b/i.test(clean)) structure += 35;
      if (/\b(step by step|format|bullet points|paragraph|table|json|markdown)\b/i.test(clean)) structure += 35;
      if (/\b(example|examples|constraints|tone|length)\b/i.test(clean)) structure += 20;
      if (length > 18) structure += 10;

      return {
        specificity: Math.min(specificity, 100),
        clarity: Math.min(clarity, 100),
        structure: Math.min(structure, 100)
      };
    }

    function setBar(fillId, pctId, value) {
      document.getElementById(fillId).style.width = `${value}%`;
      document.getElementById(pctId).textContent = `${value}%`;
    }

    function buildFeedback(scores) {
      const overall = Math.round((scores.specificity + scores.clarity + scores.structure) / 3);
      const tips = [];

      if (scores.specificity < 70) tips.push("Add audience, output type, and exact constraints.");
      if (scores.clarity < 70) tips.push("Start with a stronger action like explain, compare, or generate.");
      if (scores.structure < 70) tips.push("Include role-setting or a target format such as bullets, table, or steps.");

      if (!tips.length) {
        return `Strong prompt.\n\nOverall Score: ${overall}/100\n\nIt is specific, clear, and well-structured.`;
      }

      return `Overall Score: ${overall}/100\n\nImprove this prompt by:\n- ${tips.join("\n- ")}`;
    }

    document.getElementById("analyzeBtn").addEventListener("click", () => {
      const text = document.getElementById("promptInput").value;
      if (!text.trim()) {
        document.getElementById("trainerFeedback").textContent = "Please enter a prompt before analyzing.";
        return;
      }

      const scores = scorePrompt(text);
      setBar("scoreSpecific", "pctSpecific", scores.specificity);
      setBar("scoreClarity", "pctClarity", scores.clarity);
      setBar("scoreStructure", "pctStructure", scores.structure);
      document.getElementById("trainerFeedback").textContent = buildFeedback(scores);
    });

    async function callAnthropic({ apiKey, prompt, outputId, statusId, systemPrompt }) {
      const output = document.getElementById(outputId);
      const status = document.getElementById(statusId);

      if (!apiKey) {
        status.textContent = "API key required.";
        return;
      }

      output.classList.add("visible");
      output.textContent = "Loading...";
      status.textContent = "Sending request...";

      try {
        const response = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01"
          },
          body: JSON.stringify({
            model: "claude-sonnet-4-20250514",
            max_tokens: 900,
            system: systemPrompt,
            messages: [
              {
                role: "user",
                content: prompt
              }
            ]
          })
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error?.message || "API request failed.");
        }

        const text = (data.content || [])
          .map((item) => item.text || "")
          .join("")
          .trim();

        output.textContent = text || "No response received.";
        status.textContent = "Response received.";
      } catch (error) {
        output.textContent = "Could not connect to the API.";
        status.textContent = error.message;
      }
    }

    async function callGemini({ apiKey, model, prompt, outputId, statusId, systemPrompt }) {
      const output = document.getElementById(outputId);
      const status = document.getElementById(statusId);

      if (!apiKey) {
        status.textContent = "Gemini API key required.";
        return;
      }

      if (!model) {
        status.textContent = "Gemini model required.";
        return;
      }

      output.classList.add("visible");
      output.textContent = "Loading...";
      status.textContent = "Sending request...";

      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": apiKey
          },
          body: JSON.stringify({
            systemInstruction: {
              parts: [{ text: systemPrompt }]
            },
            contents: [
              {
                parts: [{ text: prompt }]
              }
            ],
            generationConfig: {
              maxOutputTokens: 900,
              temperature: 0.7
            }
          })
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error?.message || "Gemini API request failed.");
        }

        const text = (data.candidates || [])
          .flatMap((candidate) => candidate.content?.parts || [])
          .map((part) => part.text || "")
          .join("")
          .trim();

        output.textContent = text || "No response received.";
        status.textContent = "Response received.";
      } catch (error) {
        output.textContent = "Could not connect to Gemini API.";
        status.textContent = error.message;
      }
    }

    document.getElementById("aiFeedbackBtn").addEventListener("click", () => {
      const apiKey = document.getElementById("apiKeyInput").value.trim();
      const text = document.getElementById("aiFeedbackInput").value.trim();

      if (!text) {
        document.getElementById("feedbackStatus").textContent = "Prompt required.";
        return;
      }

      callAnthropic({
        apiKey,
        prompt: `Analyze this prompt and give concise actionable feedback focused on specificity, clarity, role-setting, and constraints.\n\nPrompt:\n${text}`,
        outputId: "aiFeedbackText",
        statusId: "feedbackStatus",
        systemPrompt: "You are an expert prompt engineering coach. Respond with short, practical feedback."
      });
    });

    document.getElementById("aiRewriteBtn").addEventListener("click", () => {
      const apiKey = document.getElementById("apiKeyInputRewrite").value.trim();
      const text = document.getElementById("aiRewriteInput").value.trim();

      if (!text) {
        document.getElementById("rewriteStatus").textContent = "Prompt required.";
        return;
      }

      callAnthropic({
        apiKey,
        prompt: `Rewrite this weak prompt into a stronger professional prompt with clear role, task, constraints, and output format.\n\nOriginal prompt:\n${text}`,
        outputId: "aiRewriteText",
        statusId: "rewriteStatus",
        systemPrompt: "You are an expert prompt engineer. Return only the improved prompt."
      });
    });

    document.getElementById("geminiFeedbackBtn").addEventListener("click", () => {
      const apiKey = document.getElementById("geminiApiKeyInput").value.trim();
      const model = document.getElementById("geminiModelInput").value.trim();
      const text = document.getElementById("geminiPromptInput").value.trim();

      if (!text) {
        document.getElementById("geminiStatus").textContent = "Prompt required.";
        return;
      }

      callGemini({
        apiKey,
        model,
        prompt: `Analyze this prompt and give concise actionable feedback focused on specificity, clarity, role-setting, and constraints.\n\nPrompt:\n${text}`,
        outputId: "geminiOutputText",
        statusId: "geminiStatus",
        systemPrompt: "You are an expert prompt engineering coach. Respond with short, practical feedback."
      });
    });

    document.getElementById("geminiRewriteBtn").addEventListener("click", () => {
      const apiKey = document.getElementById("geminiApiKeyInput").value.trim();
      const model = document.getElementById("geminiModelInput").value.trim();
      const text = document.getElementById("geminiPromptInput").value.trim();

      if (!text) {
        document.getElementById("geminiStatus").textContent = "Prompt required.";
        return;
      }

      callGemini({
        apiKey,
        model,
        prompt: `Rewrite this weak prompt into a stronger professional prompt with clear role, task, constraints, and output format.\n\nOriginal prompt:\n${text}`,
        outputId: "geminiOutputText",
        statusId: "geminiStatus",
        systemPrompt: "You are an expert prompt engineer. Return only the improved prompt."
      });
    });
