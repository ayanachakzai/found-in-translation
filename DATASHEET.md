# Datasheet: found_in_translation_DATASHEET.csv


## Motivation

*The questions in this section are primarily intended to encourage dataset creators to clearly articulate their reasons for creating the dataset and to promote transparency about funding interests.*

1. **For what purpose was the dataset created?** Was there a specific task in mind? Was there a specific gap that needed to be filled? Please provide a description.

The dataset of stories was collected as our project Lost In Transation aims to fine tune a model on the stories from different regions of the world. At the moment we have dataset of stories from Pakistan, Afghanistan, China, India, Latin America, Germany and Romania.

2. **Who created this dataset (e.g. which team, research group) and on behalf of which entity (e.g. company, institution, organization)**?

The dataset was created by the group working on this project on behalf of University of the Arts London Creative Computing Institute. The group members consists of:
    1. Maria Naqvi 
    2. Daria Cotocu
    3. Muhammad Ayan Achakzai
    4. Harshada Dattatray Pathare 

3. **What support was needed to make this dataset?** (e.g. who funded the creation of the dataset? If there is an associated grant, provide the name of the grantor and the grant name and number, or if it was supported by a company or government agency, give those details.)

This dataset was created as part of a group coursework project for the MSc Applied Machine Learning for Creatives programme at the Creative Computing Institute, University of the Arts London (UAL), under the supervision of Terence Broad. No external funding, grants, or sponsorship were received. The dataset was produced using the students' own time and personal computing resources, alongside free and open-source tools.

4. **Any other comments?**

- Folk stories from Pakistani, Afghan, Spanish, Indian regional languages are almost entirely absent from existing ML datasets. The dominant datasets are English-first, and even multilingual ones tend to represent major world languages. Balochi, Hindko, Torwali, Brahui — these are effectively invisible in the ML landscape.
- The dataset was therefore built with an explicit cultural recovery aim: to make these stories legible to machine learning systems, and through that, to an installation audience who may never otherwise encounter them.
- Finally, the dataset was designed for use in a RAG-based generative system, not for classification or standard NLP benchmarking. Its intended downstream use is cultural remix and retelling and that intended use shaped every curation decision, from story length caps to thematic labeling to the choice to work entirely in English translation.



## Composition 

*Dataset creators should read through the questions in this section prior to any data collection and then provide answers once collection is complete. Most of these questions are intended to provide dataset consumers with the information they need to make informed decisions about using the dataset for specific tasks. The answers to some of these questions reveal information about compliance with the EU’s General Data Protection Regulation (GDPR) or comparable regulations in other jurisdictions.*

1. **What do the instances that comprise the dataset represent (e.g. documents, photos, people, countries)?** Are there multiple types of instances (e.g. movies, users, and ratings; people and interactions between them; nodes and edges)? Please provide a description.

	Each instance represents a single folk tale or traditional story sourced from a specific cultural region. There is one type of instance throughout the dataset: a structured text record of a story. Each record combines metadata (title, geographic origin) with extracted thematic labels and the full story text in English.

2. **How many instances are there in total (of each type, if appropriate)?**

	The final cleaned dataset contains fewer than 50 story instances. The exact count reflects the volume of material that passed quality and consistency checks during the data cleaning phase, after removing entries that did not meet the agreed folk tale criteria or lacked sufficient textual content.

3. **Does the dataset contain all possible instances or is it a sample (not necessarily random) of instances from a larger set?** If the dataset is a sample, then what is the larger set? Is the sample representative of the larger set (e.g. geographic coverage)? If so, please describe how this representativeness was validated/verified. If it is not representative of the larger set, please describe why not (e.g. to cover a more diverse range of instances, because instances were withheld or unavailable).

This dataset is a selected sample, not a complete collection. Folk tales and oral stories exist across many cultures and languages around the world, and this project does not claim to represent all of them equally.

The stories were chosen to include a mix of cultural traditions and regions. However, some cultures are represented more than others. This is because team members collected different amounts of data, some public domain stories were easier to find in English than others, and there was limited time to gather more material.
	

4. **What data does each instance consist of?** "Raw" data (e.g. unprocessed text or images) or features? In either case, please provide a description.

	The final cleaned dataset contains fewer than 50 story instances. The exact count reflects the volume of material that passed quality and consistency checks during the data cleaning phase, after removing entries that did not meet the agreed folk tale criteria or lacked sufficient textual content.

5. **Is there a label or target associated with each instance?** If so, please provide a description.

	Yes. Each instance carries five thematic labels. These were subsequently reviewed and consolidated at the dataset level into five thematic categories, Love, Greed, Mysticism, Power, and Wisdom which served as the primary classification framework for model training. These theme labels function as the primary targets for the generative model.

6. **Is any information missing from individual instances?** If so, please provide a description, explaining why this information is missing (e.g. because it was unavailable). This does not include intentionally removed information, but might include, e.g. redacted text.

	Some stories may have incomplete or general information about where they come from. Since multiple people collected the data separately, the “origin” field is not always the same level of detail. Some entries list a specific country, while others only list a broader cultural region for example, Latin America.

A small number of stories may also not include the original language source because they were only available in English translation with limited background information. However, every entry still includes the main story text and its thematic labels.

7. **Are relationships between individual instances made explicit (e.g. users' movie ratings, social network links)?** If so, please describe how these relationships are made explicit.

Not exactly. The stories are not directly connected to each other through specific relationship fields in the dataset.

However, stories can still be grouped by shared themes. For example, all stories labelled “Mysticism” or “Greed” can be looked at together. These connections are based on interpretation, rather than being formally built into the dataset.

8. **Are there recommended data splits (e.g. training, development/validation, testing)?** If so, please provide a description of these splits, explaining the rationale behind them.

	No formal train, validation, or test split was created before collecting the data. Since the dataset is quite small, with fewer than 50 entries, the full dataset was used for fine-tuning.

Later on, a RAG approach was added to improve the quality of the outputs and help reduce hallucinations. This helps make up for some of the limitations of training with a small dataset.


9. **Are there any errors, sources of noise, or redundancies in the dataset?** If so, please provide a description.

Yes, there are some limitations. Since multiple people collected the data and there was no shared format at the beginning, some fields were filled out differently. This mainly affected the origin field and the way story types were classified.

Some early entries also did not fully match the folk tale definition, such as children’s stories, poems, or short fiction. These had to be manually reviewed and removed.

The thematic labels were generated by an algorithm, so they may not always be perfect and could reflect some bias or mistakes. Some cultural regions may also be represented more than others. These issues were partly addressed during the cleaning process, but future users of the dataset should still keep them in mind.


10. **Is the dataset self-contained, or does it link to or otherwise rely on external resources (e.g. websites, tweets, other datasets)?** If it links to or relies on external resources, a) are there guarantees that they will exist, and remain constant, over time; b) are there official archival versions of the complete dataset (i.e., including the external resources as they existed at the time the dataset was created); c) are there any restrictions (e.g. licenses, fees) associated with any of the external resources that might apply to a future user? Please provide descriptions of all external resources and any restrictions associated with them, as well as links or other access points, as appropriate.

The final dataset is self-contained as a CSV file, meaning all of the story text is included directly in the file rather than linked elsewhere.


11. **Does the dataset contain data that might be considered confidential (e.g. data that is protected by legal privilege or by doctor-patient confidentiality, data that includes the content of individuals' non-public communications)?** If so, please provide a description.

No. All stories were sourced from publicly available, non-confidential sources. 

12. **Does the dataset contain data that, if viewed directly, might be offensive, insulting, threatening, or might otherwise cause anxiety?** If so, please describe why.

Potentially, in limited cases. Folk tales and traditional stories frequently contain themes of violence, death, moral punishment, supernatural threat, and social hierarchy that reflect the cultural context in which they originated. These elements are intrinsic to the genre and have not been edited out. 

13. **Does the dataset relate to people?** If not, you may skip the remaining questions in this section.

	Only in the sense that the stories contain fictional characters and cultural figures. The dataset does not contain data about real, identifiable living individuals.

14. **Does the dataset identify any subpopulations (e.g. by age, gender)?** If so, please describe how these subpopulations are identified and provide a description of their respective distributions within the dataset.

	N/A

15. **Is it possible to identify individuals (i.e., one or more natural persons), either directly or indirectly (i.e., in combination with other data) from the dataset?** If so, please describe how.

	N/A

16. **Does the dataset contain data that might be considered sensitive in any way (e.g. data that reveals racial or ethnic origins, sexual orientations, religious beliefs, political opinions or union memberships, or locations; financial or health data; biometric or genetic data; forms of government identification, such as social security numbers; criminal history)?** If so, please provide a description.

	The dataset includes stories from different cultural and ethnic traditions. These stories may reflect religious beliefs, spiritual practices, and cultural values.

17. **Any other comments?**

	The theme categories, Love, Greed, Mysticism, Power, and Wisdom, were created based on patterns the group noticed during the cleaning process. They reflect the group’s interpretation, not a universal classification system.


## Collection

*As with the previous section, dataset creators should read through these questions prior to any data collection to flag potential issues and then provide answers once collection is complete. In addition to the goals of the prior section, the answers to questions here may provide information that allow others to reconstruct the dataset without access to it.*

1. **How was the data associated with each instance acquired?** Was the data directly observable (e.g. raw text, movie ratings), reported by subjects (e.g. survey responses), or indirectly inferred/derived from other data (e.g. part-of-speech tags, model-based guesses for age or language)? If data was reported by subjects or indirectly inferred/derived from other data, was the data validated/verified? If so, please describe how.

The data was directly observable and was collected as raw text from different online sources (PDFs, books etc).

2. **What mechanisms or procedures were used to collect the data (e.g. hardware apparatus or sensor, manual human curation, software program, software API)?** How were these mechanisms or procedures validated?

The procedures to collect the data were a combination. We found different books and stories from our own cultures and we extracted the txt files from websites or books. We did that using python code to extract the txt files, but finding the stories itsefl was manual human curation. 

3. **If the dataset is a sample from a larger set, what was the sampling strategy (e.g. deterministic, probabilistic with specific sampling probabilities)?**

The dataset is not a sample from a larger set. 

4. **Who was involved in the data collection process (e.g. students, crowdworkers, contractors) and how were they compensated (e.g. how much were crowdworkers paid)?**

The dataset was assembled together as a group. We sourced stories from underrepresented cultures that we have connections to, with additional input from friends who have personal ties to those countries. 

5. **Over what timeframe was the data collected?** Does this timeframe match the creation timeframe of the data associated with the instances (e.g. recent crawl of old news articles)? If not, please describe the timeframe in which the data associated with the instances was created. Finally, list when the dataset was first published.

The timeframe in which the data was collected is April 2026 to May 2026. These are old, well-established stories, so the year when they were published does not affect us. 

7. **Were any ethical review processes conducted (e.g. by an institutional review board)?** If so, please provide a description of these review processes, including the outcomes, as well as a link or other access point to any supporting documentation.

Any ethical review process was not applicable for our dataset. 

8. **Does the dataset relate to people?** If not, you may skip the remainder of the questions in this section.

No, our dataset relates to stories not people. 

9. **Did you collect the data from the individuals in question directly, or obtain it via third parties or other sources (e.g. websites)?**

N/A

10. **Were the individuals in question notified about the data collection?** If so, please describe (or show with screenshots or other information) how notice was provided, and provide a link or other access point to, or otherwise reproduce, the exact language of the notification itself.

N/A

11. **Did the individuals in question consent to the collection and use of their data?** If so, please describe (or show with screenshots or other information) how consent was requested and provided, and provide a link or other access point to, or otherwise reproduce, the exact language to which the individuals consented.

N/A

12. **If consent was obtained, were the consenting individuals provided with a mechanism to revoke their consent in the future or for certain uses?** If so, please provide a description, as well as a link or other access point to the mechanism (if appropriate).

N/A

13. **Has an analysis of the potential impact of the dataset and its use on data subjects (e.g. a data protection impact analysis) been conducted?** If so, please provide a description of this analysis, including the outcomes, as well as a link or other access point to any supporting documentation.

N/A

14. **Any other comments?**



## Preprocessing / Cleaning / Labeling

*Dataset creators should read through these questions prior to any pre-processing, cleaning, or labeling and then provide answers once these tasks are complete. The questions in this section are intended to provide dataset consumers with the information they need to determine whether the “raw” data has been processed in ways that are compatible with their chosen tasks. For example, text that has been converted into a “bag-of-words” is not suitable for tasks involving word order.*

1. **Was any preprocessing/cleaning/labeling of the data done (e.g. discretization or bucketing, tokenization, part-of-speech tagging, SIFT feature extraction, removal of instances, processing of missing values)?** If so, please provide a description. If not, you may skip the remainder of the questions in this section.

    Cleaning, labeling, translation and consolidation all were done on our dataset. 
    Cleaning was done as in our raw dataset we had issues with OCR, we hadd null values even with scraped content, and also there were stories with special characters. In some cases, with raw dataset, it also had sources which wee not necessary for our training purposes so cleaning was done on sources too.
    Labelling was done to each story according to the theme it matched. Each story belong to a certain language and to a certain region. Therefore each story was also labelled according to their respective theme, country and language.
    Translation was an integral part of our data processing. There were many stories that were in Hindi, Urdu, Chinese, Spanish, Pashto, Farsi, Hindko etc. These are all local languages so all of these stories had to be translated. The translation was then vetted by native speakers of those regions to ensure that each story mantained its integrity.
    Finally, all the separate datasets of each individual were consolidated into one dataset for training purposes.
   
3. **Was the "raw" data saved in addition to the preprocessed/cleaned/labeled data (e.g. to support unanticipated future uses)?** If so, please provide a link or other access point to the "raw" data.

    Yes, the raw data is available in the archive of the project to be accessible to each user for cross-referencing and also for cleaning the dataset.

4. **Is the software used to preprocess/clean/label the instances available?** If so, please provide a link or other access point.

    Every thing for data cleaning, processing and labebling was done manually by an individual so that the stories were coherent and verified by human intelligence, therefore no software was used.

5. **Any other comments?**

n/a

## Uses

*These questions are intended to encourage dataset creators to reflect on the tasks  for  which  the  dataset  should  and  should  not  be  used.  By  explicitly highlighting these tasks, dataset creators can help dataset consumers to make informed decisions, thereby avoiding potential risks or harms.*

1. **Has the dataset been used for any tasks already?** If so, please provide a description.

This dataset has been used for a university project called Found in Translation for the course of MSc in Applied Machine Learning at the University of Arts London, Creative Computing Institute.


2. **Is there a repository that links to any or all papers or systems that use the dataset?** If so, please provide a link or other access point.

The repository is shared with 4 students who worked on this project. Here is the link for it: https://git.arts.ac.uk/m-naqvi0220251/found_in_translation

3. **What (other) tasks could the dataset be used for?**

The Dataset could be used for the following possible purposes:
1. Creative writing and story generation applications.
2. Story Retrieval and Recommendation Systems.
3. Research into multilingual and underrepresented cultural narratives.  


4. **Is there anything about the composition of the dataset or the way it was collected and preprocessed/cleaned/labelled that might impact future uses?** For example, is there anything that a future user might need to know to avoid uses that could result in unfair treatment of individuals or groups (e.g. stereotyping, quality of service issues) or other undesirable harms (e.g. financial harms, legal risks) If so, please provide a description. Is there anything a future user could do to mitigate these undesirable harms?

It is advised to read and review generated outputs for cultural sensitivity and accuracy when using this dataset to fine-tune any model or create an application.

The stories are narrative and folkloric in nature and should not be interpreted as objective representations of cultures, communities, or historical events.


5. **Are there tasks for which the dataset should not be used?** If so, please provide a description.

This dataset should not be used for Factual or historical-related fine-tuning or training the model.

6. **Any other comments?**

The Dataset was collected as part of a University group project at the Creative Computing Institute. The project explores how machine learning can be used to engage with underrepresented cultural narratives through interactive storytelling. 

The dataset prioritises cultural diversity and narrative richness over scale and should be understood as a curated collection rather than a comprehensive archive of any culture or tradition. 


## Distribution

*Dataset creators should provide answers to these questions prior to distributing the dataset either internally within the entity on behalf of which the dataset was created or externally to third parties.*

1. **Will the dataset be distributed to third parties outside of the entity (e.g. company, institution, organization) on behalf of which the dataset was created?** If so, please provide a description.

The dataset will not be distrubuted outside of this universty project. 

2. **How will the dataset will be distributed (e.g. tarball on website, API, GitHub)?** Does the dataset have a digital object identifier (DOI)?

The dataset will be distributed via Git.Arts for our assignment, and it does not have a DOI. 

3. **When will the dataset be distributed?**

 The dataset will only be submitted for our assignment. 


4. **Will the dataset be distributed under a copyright or other intellectual property (IP) license, and/or under applicable terms of use (ToU)?** If so, please describe this license and/or ToU, and provide a link or other access point to, or otherwise reproduce, any relevant licensing terms or ToU, as well as any fees associated with these restrictions.

N/A

5. **Have any third parties imposed IP-based or other restrictions on the data associated with the instances?** If so, please describe these restrictions, and provide a link or other access point to, or otherwise reproduce, any relevant licensing terms, as well as any fees associated with these restrictions.

N/A

6. **Do any export controls or other regulatory restrictions apply to the dataset or to individual instances?** If so, please describe these restrictions, and provide a link or other access point to, or otherwise reproduce, any supporting documentation.

N/A

7. **Any other comments?**

N/A


## Maintenance

*As with the previous section, dataset creators should provide answers to these questions prior to distributing the dataset. These questions are intended to encourage dataset creators to plan for dataset maintenance and communicate this plan with dataset consumers.*

1. **Who is supporting/hosting/maintaining the dataset?**

The students of the Creative Computing Institute who created this project are supporting and hosting this dataset.


2. **How can the owner/curator/manager of the dataset be contacted (e.g. email address)?**

The creators of this dataset are as follows, with their contact information:
1. Daria Cotocu = d-cotocu0620252@arts.ac.uk
2. Ayan Achakzai = m-achakzai0320251@arts.ac.uk
3. Harshada Pathare = h-pathare0620251@arts.ac.uk
4. Maria Naqvi = m-naqvi0220251@arts.ac.uk


3. **Is there an erratum?** If so, please provide a link or other access point.

   N/A

4. **Will the dataset be updated (e.g. to correct labeling errors, add new instances, delete instances)?** If so, please describe how often, by whom, and how updates will be communicated to users (e.g. mailing list, GitHub)?

No. The dataset is being developed specifically for the Found in Translation MSc Applied Machine Learning project and will not be actively maintained after project submission. The final version of the dataset will remain available through the project repository for reference and reproducibility purposes. Any future modifications or extensions would need to be managed independently by subsequent users.

5. **If the dataset relates to people, are there applicable limits on the retention of the data associated with the instances (e.g. were individuals in question told that their data would be retained for a fixed period of time and then deleted)?** If so, please describe these limits and explain how they will be enforced.

N/A

6. **Will older versions of the dataset continue to be supported/hosted/maintained?** If so, please describe how. If not, please describe how its obsolescence will be communicated to users.

However, the individual country-specific datasets that were created during the data collection process will remain available in separate branches of the project repository. These branches document the contributions made by individual group members, who were responsible for collecting, cleaning, and structuring stories from specific countries and cultural contexts before the datasets were merged into a single unified dataset.

These branches serve as a record of the dataset development process and provide transparency regarding how the final dataset was assembled. Future users wishing to understand, reproduce, or extend the dataset may refer to these branches for access to the intermediate country-level datasets and associated processing workflows.

7. **If others want to extend/augment/build on/contribute to the dataset, is there a mechanism for them to do so?** If so, please provide a description. Will these contributions be validated/verified? If so, please describe how. If not, why not? Is there a process for communicating/distributing these contributions to other users? If so, please provide a description.

Yes. Users may download the dataset and extend it by adding new stories that follow the existing dataset structure. The project repository includes code for merging additional datasets with the original dataset, provided that contributors maintain the same CSV format and schema.

As the project will not be actively maintained after submission, future contributors should contact the dataset curators using the email addresses provided in the repository. Any contributions should follow the existing dataset structure and may be reviewed by the original authors where possible.

8. **Any other comments?**

The dataset was designed to support creative storytelling, cultural exploration, and generative AI applications. Users are encouraged to engage with the dataset respectfully and acknowledge the cultural origins of the stories when adapting, extending, or repurposing the material.
