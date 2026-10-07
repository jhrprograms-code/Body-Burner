# Research and product decisions

The earlier research foundation contains 105 abstract reviews, 39 retrieved full texts, 9 main-body/table appraisals and one additional selected-section review. It does **not** represent 105 completed critical full-text reviews. The remaining main-text appraisal queue and correction notices remain outstanding. This app does not pretend the research was exhaustively completed or that it can train itself into a clinician or qualified coach.

The 200-exercise catalogue comes from that earlier draft dataset. Original draft cues and IDs were retained; provider preview links and unlicensed assets were not copied into the app. `data/exercises.json` is not a clinical validation certificate. The app's conservative, editable starter templates are separate product defaults, not approved automatic prescriptions from the foundation's gated rules register.

## Principles used

- Resistance training, progressive overload, recovery and consistent logging are the core training workflow.
- The user-selected schedule uses push/pull/legs twice weekly, Monday through Saturday, with Sunday as the single recovery day. Repeating the split spaces direct work for a major muscle group across the week; six gym visits do not automatically produce greater fat loss.
- Each gym day targets 80–90 minutes: about 10 minutes of warm-up, 60–65 minutes of resistance work, and 10–15 minutes of easy conditioning or cooldown. The duration is a scheduling constraint, not evidence that longer workouts are inherently better.
- Begin with manageable loads and technique practice. Progression uses completed rep sets, effort and pain flags; no starting kilograms are inferred from a body photograph.
- Protein and total energy matter, but a supplement is optional and photos cannot reveal exact energy intake.
- Weight trend, waist, performance and subjective recovery are considered together. Scale changes can include hydration/creatine-related changes; the app does not label every change as fat.
- The app offers no spot-reduction promise or UFC-style rapid dehydration protocol. Celebrity/trainer advice is not treated as stronger evidence than the underlying research.
- Meal estimates include uncertainty and user confirmation. No exhaustive food/Costco inventory is promised.

One foundational protein/resistance-training review, already represented in the earlier appraisal set:
Morton et al. (2018), systematic review/meta-analysis of protein supplementation with resistance training in healthy adults, https://pubmed.ncbi.nlm.nih.gov/28698222/ . Its population and energy-balance limits should not be ignored when discussing dieting.

The six-day split also reflects the 2026 ACSM resistance-training position stand's emphasis on consistent, individualized resistance training rather than a single universally optimal routine, plus review evidence that training major muscle groups twice weekly can support hypertrophy. Longer rests can help preserve strength performance, especially for trained lifters:

- ACSM (2026), Resistance Training Prescription for Muscle Function, Hypertrophy, and Physical Performance in Healthy Adults: https://acsm.org/science-spotlight-acsm-releases-new-position-stand-on-resistance-training/
- Schoenfeld et al. (2016), training-frequency systematic review and meta-analysis: https://pubmed.ncbi.nlm.nih.gov/27102172/
- Grgic et al. (2018), inter-set-rest systematic review: https://pubmed.ncbi.nlm.nih.gov/28933024/

## Competitor patterns informing the design

This is a review of published official feature descriptions, not a hands-on audit of paid accounts. No proprietary screens, code, exercise GIFs or food databases were copied.

| App          | Useful pattern adopted or considered                                        |
| ------------ | --------------------------------------------------------------------------- |
| MacroFactor  | Weekly reflection and trends; automatic expenditure adaptation is deferred. |
| Hevy         | Fast set table, previous-performance context and workout history.           |
| Fitbod       | Equipment/availability preferences; recovery predictions are not claimed.   |
| MyFitnessPal | Food search, portion confirmation and custom foods.                         |
| Cronometer   | Nutrition-source labels and avoiding false certainty in missing values.     |
| Strong       | Focused workout logging and rest timers.                                    |
| Caliber      | Supportive coaching explanations; no human-coaching service is implied.     |
| JEFIT        | Searchable exercise catalogue and routine structure.                        |
| Lose It!     | Calorie budget, meal sections and photo-to-review workflow.                 |
| Boostcamp    | Visible weekly structure and strength-training logs.                        |

The visual design follows the user's black-and-white preference and the supplied meal/workout screenshots, with original layout/code/icons rather than reproducing another app's branded assets.

Official product references reviewed:

- https://help.macrofactorapp.com/en/articles/247-introduction-to-check-ins-and-coaching-modules
- https://help.hevyapp.com/hc/en-us/articles/38385724273047-Hevy-Trainer-Explained-How-It-Builds-Your-Workout-Program
- https://help.fitbod.me/hc/en-us/articles/360004429814-How-Fitbod-Creates-Your-Workout
- https://support.myfitnesspal.com/hc/en-us/articles/34889191368077-The-difference-between-Free-Premium-and-Premium
- https://cronometer.com/features/accurate-databases.html
- https://www.strong.app/
- https://caliberstrong.com/workout-app/
- https://www.jefit.com/use-case/workout-planner
- https://play.google.com/store/apps/details?id=com.fitnow.loseit
- https://www.boostcamp.app/workout-tracker
