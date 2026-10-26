# Project context for Claude

- Goal: regional Indian folk songs (Garhwali, Kumaoni, Himachali, Haryanvi, Rajasthani, Marathi) fused with modern production and rap.
- The user is not fluent in these languages: write lyrics as Devanagari | Roman | English meaning, flag uncertain dialect words, and always recommend native-speaker review.
- Budget: free or cheapest tools first. See `_shared/references/free-tools.md`.
- Hardware: Intel iGPU only (no CUDA), 15 GB RAM, so run AI models on Kaggle/Colab and keep editing, stems and mastering local.
- Never put real artist names in generation prompts, and never clone a real singer's voice without consent.
- New song: `_shared/scripts/new-song.sh <lang> <slug>`; fill in brief.md → lyrics.md → prompts.md in that order.
