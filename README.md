# Multimedia Machine Learning Project 25/26

### Project name: Found in Translation 
### Group number: 3
### Group members:
- Maria Naqvi, 25000922
- Daria Cotocu, 20010160
- Muhammad Ayan Achakzai, 25001602
- Harshada Pathare, 25031249
### Link to dataset on UAL onedrive: 

Added in the Github repo

### Link to video of project demo on UAL onedrive:

https://artslondon-my.sharepoint.com/:v:/g/personal/d_cotocu0620252_arts_ac_uk/IQBbtDmyEgu0SIBldf1HykgpAXJf7n1fGHM8vqeP2Y7CRlQ?nav=eyJyZWZlcnJhbEluZm8iOnsicmVmZXJyYWxBcHAiOiJPbmVEcml2ZUZvckJ1c2luZXNzIiwicmVmZXJyYWxBcHBQbGF0Zm9ybSI6IldlYiIsInJlZmVycmFsTW9kZSI6InZpZXciLCJyZWZlcnJhbFZpZXciOiJNeUZpbGVzTGlua0NvcHkifX0&e=LFFMd6

## Overview of project
Found in Translation is a physical installation in which 3d printed objects trigger AI-generated stories from underrepresented cultures around the world. Each object is associated with one of five themes: wisdom, greed, power, mysticism, and love. When an object is held up to a camera, the system recognises it, retrieves story fragments linked to its theme, and generates a unique remixed story from those fragments.


## Instructions for running project demo
Setup instructions and instructions for running the code for the interactive project demo. 

The demo was developed and tested on a desktop computer in Greencoat equipped with a GPU 4900.
To run the project:

## Running the Project

### 1. Activate the Conda environment

```bash
conda activate mml
```

### 2. Run the main script

```bash
python found_in_translation_windows.py
```

## Generating a New Story Without Printing

To generate a new story without sending it to the physical printer, open `found_in_translation_windows.py` and update line 53:

```python
PRINT_TO_PHYSICAL_PRINTER = False
```

When this is set to `False`, the script will generate the story digitally without printing it through the thermal printer.


Before running the script, make sure the LoRA adapter path points to the final adapter folder:

```text
/Current-Lora/folkstory_lora_output_v2/final_adapter
```

**Final dataset:**

```text
found_in_translation_DATASHEET.csv
```


## Additional project outcomes
Each generated story is printed as a physical receipt via a thermal printer, borrowed from the kit room. 

## Supplementary materials
This project also produced five 3D-printed objects used as physical triggers in the installation: an owl (wisdom), a snake (greed), a rose (love), a crown (power), and a star (mysticism).

## References
- Gebru, T. et al. (2021) “Datasheets for datasets,” Communications of the ACM, 64(12), pp. 86–92. Available at: https://doi.org/10.1145/3458723.
- Joshi, P. et al. (2020) “The State and Fate of Linguistic Diversity and Inclusion in the NLP World,” Proceedings of the 58th Annual Meeting of the Association for Computational Linguistics. Proceedings of the 58th Annual Meeting of the Association for Computational Linguistics, Online: Association for Computational Linguistics, pp. 6282–6293. Available at: https://doi.org/10.18653/v1/2020.acl-main.560.
- Magueresse, A., Carles, V. and Heetderks, E. (2020) “Low-resource Languages: A Review of Past Work and Future Challenges.” arXiv. Available at: https://doi.org/10.48550/arXiv.2006.07264.
- Consolvo, B. (2025) Deploying AI agents locally with QWEN3, Qwen-agent, and ollama , Medium. Available at: https://medium.com/intel-tech/deploying-ai-agents-locally-with-qwen3-qwen-agent-and-ollama-cad452f20be5 (Accessed: 14 June 2026).
- PrajnaAI (2025) Hybrid approaches: Combining rag and finetuning for optimal LLM Performance | by Prajnaai | Medium, Medium. Available at: https://prajnaaiwisdom.medium.com/hybrid-approaches-combining-rag-and-finetuning-for-optimal-llm-performance-35d2bf3582a9 (Accessed: June 2026).
- How to reduce LLM hallucinations: A developer’s guide (2026) Zep. Available at: https://www.getzep.com/ai-agents/reducing-llm-hallucinations/ (Accessed: 1 June 2026).
- Holla, K. (no date) Fine tuning LLM for parsing and serving through ollama , Medium. Available at: https://pub.towardsai.net/fine-tuning-llm-for-parsing-and-serving-through-ollama-e224a8a5636a?gi=e278b306a0e1 (Accessed: 14 June 2026).
- Singh, S. (2025) Complete guide: Fine-tuning llama 3.2 locally with Ollama and Lora , Medium. Available at: https://medium.com/@sausi/complete-guide-fine-tuning-llama-3-2-locally-with-ollama-and-lora-be7eb05314ff (Accessed: 14 June 2026). 
