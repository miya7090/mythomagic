# mythomagic

[https://mythomagic.herokuapp.com/](https://mythomagic.herokuapp.com/)

inspired by [mythomagic](https://riordan.fandom.com/wiki/Mythomagic) from the [percy jackson series](https://rickriordan.com/series/percy-jackson-and-the-olympians/) ♆  
icons from [freepik on flaticon](https://www.flaticon.com/authors/freepik), bgm from [the seventh midnight](https://www.youtube.com/c/TheSeventhMidnight/)  
sound effects from [miya7090](https://github.com/miya7090/), [cpht fluke](https://www.youtube.com/channel/UCBlyQ5LHho5o7JQE1WocXuQ), and [alan dalcastagne](https://www.youtube.com/channel/UCLfn0jnl1ye_AkuSeu5l3Uw)

---

run `npm start` and go to `http://localhost:3000/` to test locally

---

### how to add a new card
1. add an icon or ensure an icon already exists in `public/images/portraits`
2. add hero entry to BASE_STAT_DICT in `config.js`
3. update any relevant group lists (e.g. OLYMPIAN_LIST) in `config.js`
4. update ABILITY_MAP and ULT_MAP in `abilities.js`, and add functions for the ability and ultimate in the same file
5. add the passive function to `passives.js`, or if locating the passive function elsewhere, denote location at top of `passives.js` and comment a label next to the code's actual location
6. test that the ability, ultimate, and passive all function correctly
7. open a pull request and ask for the mongoDB `heroboard` database to be updated
