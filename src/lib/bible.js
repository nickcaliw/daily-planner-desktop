const VERSES = [
  {
    verse: "I can do all things through Christ who strengthens me.",
    reference: "Philippians 4:13",
    explanation: "Whatever challenge you face today, you don't face it alone. Draw on a strength greater than your own."
  },
  {
    verse: "For I know the plans I have for you, declares the Lord, plans to prosper you and not to harm you, plans to give you hope and a future.",
    reference: "Jeremiah 29:11",
    explanation: "Even when life feels uncertain, trust that there is a purposeful plan unfolding. Your future is held in good hands."
  },
  {
    verse: "The Lord is my shepherd; I shall not want.",
    reference: "Psalm 23:1",
    explanation: "You are guided and provided for. Release the anxiety of scarcity and trust that your needs will be met."
  },
  {
    verse: "Trust in the Lord with all your heart and lean not on your own understanding.",
    reference: "Proverbs 3:5",
    explanation: "When things don't make sense, that's okay. Sometimes the best move is to trust the process rather than demand answers."
  },
  {
    verse: "And we know that in all things God works for the good of those who love him, who have been called according to his purpose.",
    reference: "Romans 8:28",
    explanation: "Every experience, even the painful ones, is being woven into something meaningful. Nothing is wasted."
  },
  {
    verse: "Be strong and courageous. Do not be afraid; do not be discouraged, for the Lord your God will be with you wherever you go.",
    reference: "Joshua 1:9",
    explanation: "Courage isn't the absence of fear — it's moving forward despite it. You are never walking alone."
  },
  {
    verse: "But those who hope in the Lord will renew their strength. They will soar on wings like eagles; they will run and not grow weary, they will walk and not be faint.",
    reference: "Isaiah 40:31",
    explanation: "When you're running on empty, pause and refuel through faith. Renewed strength comes to those who wait."
  },
  {
    verse: "Come to me, all you who are weary and burdened, and I will give you rest.",
    reference: "Matthew 11:28",
    explanation: "You don't have to carry everything yourself. It's okay to rest, to ask for help, and to lay your burdens down."
  },
  {
    verse: "This is the day that the Lord has made; let us rejoice and be glad in it.",
    reference: "Psalm 118:24",
    explanation: "Today is a gift. Before rushing into your to-do list, take a moment to appreciate the simple fact that you're alive."
  },
  {
    verse: "Whatever you do, work at it with all your heart, as working for the Lord, not for human masters.",
    reference: "Colossians 3:23",
    explanation: "Excellence isn't about impressing others — it's about honoring your own potential. Give your best effort today."
  },
  {
    verse: "Commit to the Lord whatever you do, and he will establish your plans.",
    reference: "Proverbs 16:3",
    explanation: "Start your planning with intention and surrender. When your goals are aligned with good purpose, the path becomes clearer."
  },
  {
    verse: "Be still, and know that I am God.",
    reference: "Psalm 46:10",
    explanation: "In a world that rewards constant hustle, stillness is an act of faith. Take a quiet moment today to simply be present."
  },
  {
    verse: "No discipline seems pleasant at the time, but painful. Later on, however, it produces a harvest of righteousness and peace for those who have been trained by it.",
    reference: "Hebrews 12:11",
    explanation: "The hard work you're putting in now — the early mornings, the discipline, the sacrifice — will pay off. Keep going."
  },
  {
    verse: "Consider it pure joy, my brothers and sisters, whenever you face trials of many kinds, because you know that the testing of your faith produces perseverance.",
    reference: "James 1:2-4",
    explanation: "Difficulties aren't roadblocks — they're training grounds. Each challenge is building your resilience and character."
  },
  {
    verse: "Love is patient, love is kind. It does not envy, it does not boast, it is not proud.",
    reference: "1 Corinthians 13:4",
    explanation: "In every interaction today, lead with patience and kindness. Love is less a feeling and more a daily practice."
  },
  {
    verse: "Give thanks in all circumstances; for this is God's will for you in Christ Jesus.",
    reference: "1 Thessalonians 5:18",
    explanation: "Gratitude transforms your perspective. Even in tough times, there is always something to be thankful for."
  },
  {
    verse: "In all your ways submit to him, and he will make your paths straight.",
    reference: "Proverbs 3:6",
    explanation: "When you align your decisions with wisdom and integrity, the right direction becomes evident. Stay the course."
  },
  {
    verse: "My command is this: Love each other as I have loved you.",
    reference: "John 15:12",
    explanation: "The greatest impact you can have today is through genuine love — listening, serving, and showing up for others."
  },
  {
    verse: "The Lord is my light and my salvation — whom shall I fear?",
    reference: "Psalm 27:1",
    explanation: "Fear loses its power when you remember who's guiding you. Walk boldly into whatever today brings."
  },
  {
    verse: "Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God.",
    reference: "Philippians 4:6",
    explanation: "Anxiety shrinks when you voice your worries instead of bottling them up. Talk to God about what's on your mind."
  },
  {
    verse: "And the peace of God, which transcends all understanding, will guard your hearts and your minds in Christ Jesus.",
    reference: "Philippians 4:7",
    explanation: "There's a peace available to you that doesn't depend on your circumstances. Let it guard your thoughts today."
  },
  {
    verse: "For God has not given us a spirit of fear, but of power and of love and of a sound mind.",
    reference: "2 Timothy 1:7",
    explanation: "When self-doubt creeps in, remember: you were designed for courage, love, and clarity — not fear."
  },
  {
    verse: "The Lord is close to the brokenhearted and saves those who are crushed in spirit.",
    reference: "Psalm 34:18",
    explanation: "If you're hurting today, know that you're not alone. Your pain is seen and you are held close."
  },
  {
    verse: "Delight yourself in the Lord, and he will give you the desires of your heart.",
    reference: "Psalm 37:4",
    explanation: "When you align your joy with what truly matters, your deepest desires start to take shape naturally."
  },
  {
    verse: "Iron sharpens iron, and one person sharpens another.",
    reference: "Proverbs 27:17",
    explanation: "Surround yourself with people who challenge and inspire you. Growth happens in community, not isolation."
  },
  {
    verse: "The fear of the Lord is the beginning of wisdom, and knowledge of the Holy One is understanding.",
    reference: "Proverbs 9:10",
    explanation: "True wisdom starts with humility — recognizing there's something greater than yourself. Stay teachable today."
  },
  {
    verse: "I have told you these things, so that in me you may have peace. In this world you will have trouble. But take heart! I have overcome the world.",
    reference: "John 16:33",
    explanation: "Trouble is guaranteed, but so is the ability to overcome it. Face today's challenges with confident peace."
  },
  {
    verse: "He gives strength to the weary and increases the power of the weak.",
    reference: "Isaiah 40:29",
    explanation: "Feeling depleted doesn't mean you're failing. It means it's time to receive strength rather than manufacture it."
  },
  {
    verse: "Be kind and compassionate to one another, forgiving each other, just as in Christ God forgave you.",
    reference: "Ephesians 4:32",
    explanation: "Holding grudges only weighs you down. Choose kindness and forgiveness today — it frees you more than anyone else."
  },
  {
    verse: "For we walk by faith, not by sight.",
    reference: "2 Corinthians 5:7",
    explanation: "You don't need to see the whole staircase to take the next step. Trust what you can't yet see."
  },
  {
    verse: "The Lord your God is in your midst, a mighty one who will save; he will rejoice over you with gladness.",
    reference: "Zephaniah 3:17",
    explanation: "You are not merely tolerated — you are celebrated. Let that truth shape how you see yourself today."
  },
  {
    verse: "A gentle answer turns away wrath, but a harsh word stirs up anger.",
    reference: "Proverbs 15:1",
    explanation: "Your tone matters more than your words. In every difficult conversation today, lead with gentleness."
  },
  {
    verse: "But the fruit of the Spirit is love, joy, peace, forbearance, kindness, goodness, faithfulness, gentleness and self-control.",
    reference: "Galatians 5:22-23",
    explanation: "These qualities aren't goals to achieve but fruit to cultivate. Focus on one of these today and watch it grow."
  },
  {
    verse: "God is our refuge and strength, an ever-present help in trouble.",
    reference: "Psalm 46:1",
    explanation: "When everything feels shaky, remember you have a foundation that cannot be moved. Lean into it."
  },
  {
    verse: "Above all else, guard your heart, for everything you do flows from it.",
    reference: "Proverbs 4:23",
    explanation: "What you allow into your mind and heart shapes your actions. Be intentional about what you consume and dwell on."
  },
  {
    verse: "So do not fear, for I am with you; do not be dismayed, for I am your God.",
    reference: "Isaiah 41:10",
    explanation: "The command to 'not fear' appears hundreds of times in Scripture. Let that repetition remind you: you are never alone."
  },
  {
    verse: "I will strengthen you and help you; I will uphold you with my righteous right hand.",
    reference: "Isaiah 41:10b",
    explanation: "When you feel like you're falling, there's a hand holding you up. You are supported in ways you cannot see."
  },
  {
    verse: "The name of the Lord is a fortified tower; the righteous run to it and are safe.",
    reference: "Proverbs 18:10",
    explanation: "When life feels overwhelming, you have a place of refuge. Run toward faith, not away from it."
  },
  {
    verse: "Wait for the Lord; be strong and take heart and wait for the Lord.",
    reference: "Psalm 27:14",
    explanation: "Patience is not passive — it's an active choice to trust while you wait. Strength is found in the waiting."
  },
  {
    verse: "Have I not commanded you? Be strong and courageous. Do not be afraid; do not be discouraged.",
    reference: "Joshua 1:9a",
    explanation: "Courage is a command, not a suggestion. Step into today with the boldness you've been called to."
  },
  {
    verse: "Let us not become weary in doing good, for at the proper time we will reap a harvest if we do not give up.",
    reference: "Galatians 6:9",
    explanation: "Your consistent effort matters even when you can't see results yet. The harvest is coming — don't quit."
  },
  {
    verse: "The Lord bless you and keep you; the Lord make his face shine on you and be gracious to you.",
    reference: "Numbers 6:24-25",
    explanation: "Receive this ancient blessing today. You are kept, seen, and shown grace beyond what you could earn."
  },
  {
    verse: "He who began a good work in you will carry it on to completion until the day of Christ Jesus.",
    reference: "Philippians 1:6",
    explanation: "You are a work in progress, and that's perfectly okay. The one who started building your story will finish it."
  },
  {
    verse: "Be joyful in hope, patient in affliction, faithful in prayer.",
    reference: "Romans 12:12",
    explanation: "Three daily practices in one verse: stay hopeful, endure patiently, and keep praying. Simple but transformative."
  },
  {
    verse: "If any of you lacks wisdom, you should ask God, who gives generously to all without finding fault, and it will be given to you.",
    reference: "James 1:5",
    explanation: "Stuck on a decision? Ask for wisdom without shame. It's freely given to anyone who sincerely seeks it."
  },
  {
    verse: "For where two or three gather in my name, there am I with them.",
    reference: "Matthew 18:20",
    explanation: "Community matters. When you connect with others in purpose and faith, something powerful is present."
  },
  {
    verse: "The Lord is my strength and my shield; my heart trusts in him, and he helps me.",
    reference: "Psalm 28:7",
    explanation: "Trust is like a muscle — the more you use it, the stronger it gets. Exercise your trust today."
  },
  {
    verse: "Do everything in love.",
    reference: "1 Corinthians 16:14",
    explanation: "Four simple words that can transform your entire day. Let love be the motive behind every action."
  },
  {
    verse: "The steadfast love of the Lord never ceases; his mercies never come to an end; they are new every morning.",
    reference: "Lamentations 3:22-23",
    explanation: "Every morning is a fresh start. Yesterday's failures don't define today — new mercy is waiting for you."
  },
  {
    verse: "I sought the Lord, and he answered me; he delivered me from all my fears.",
    reference: "Psalm 34:4",
    explanation: "Don't let fear have the last word. When you seek help, deliverance follows. Ask and you shall receive."
  },
  {
    verse: "And let us consider how we may spur one another on toward love and good deeds.",
    reference: "Hebrews 10:24",
    explanation: "Be an encourager today. A kind word or act of service can spark a chain reaction of goodness."
  },
  {
    verse: "The righteous person may have many troubles, but the Lord delivers him from them all.",
    reference: "Psalm 34:19",
    explanation: "Trouble doesn't mean you're doing something wrong. What matters is that deliverance is always on the way."
  },
  {
    verse: "Cast all your anxiety on him because he cares for you.",
    reference: "1 Peter 5:7",
    explanation: "You weren't built to carry the weight of worry. Hand it over — you are deeply cared for."
  },
  {
    verse: "For I am convinced that neither death nor life, neither angels nor demons, neither the present nor the future, nor any powers, neither height nor depth, nor anything else in all creation, will be able to separate us from the love of God.",
    reference: "Romans 8:38-39",
    explanation: "Nothing — absolutely nothing — can cut you off from being loved. Let that truth anchor you today."
  },
  {
    verse: "The Lord is gracious and compassionate, slow to anger and rich in love.",
    reference: "Psalm 145:8",
    explanation: "If God is slow to anger and rich in love, perhaps we should model the same patience with ourselves and others."
  },
  {
    verse: "Seek first his kingdom and his righteousness, and all these things will be given to you as well.",
    reference: "Matthew 6:33",
    explanation: "When you prioritize what truly matters, the secondary things tend to fall into place. Focus on what's first."
  },
  {
    verse: "A cheerful heart is good medicine, but a crushed spirit dries up the bones.",
    reference: "Proverbs 17:22",
    explanation: "Joy is not just emotional — it's physical medicine. Find something to laugh about today."
  },
  {
    verse: "Therefore, if anyone is in Christ, the new creation has come: The old has gone, the new is here!",
    reference: "2 Corinthians 5:17",
    explanation: "You are not defined by your past. Every day is a chance to live as the new person you are becoming."
  },
  {
    verse: "For where your treasure is, there your heart will be also.",
    reference: "Matthew 6:21",
    explanation: "What you invest your time and energy in reveals what you truly value. Check your investments today."
  },
  {
    verse: "I will instruct you and teach you in the way you should go; I will counsel you with my loving eye on you.",
    reference: "Psalm 32:8",
    explanation: "Guidance is available to you. Stay open to instruction and trust that the right path will be revealed."
  },
  {
    verse: "Plans fail for lack of counsel, but with many advisers they succeed.",
    reference: "Proverbs 15:22",
    explanation: "Don't go it alone. Seek wise counsel before making big decisions — multiple perspectives lead to better outcomes."
  },
  {
    verse: "Create in me a pure heart, O God, and renew a steadfast spirit within me.",
    reference: "Psalm 51:10",
    explanation: "It's okay to ask for a fresh start internally. A renewed spirit changes everything about how you move through the day."
  },
  {
    verse: "The tongue has the power of life and death, and those who love it will eat its fruit.",
    reference: "Proverbs 18:21",
    explanation: "Your words matter enormously. Speak life into others today — and into yourself."
  },
  {
    verse: "For we are God's handiwork, created in Christ Jesus to do good works, which God prepared in advance for us to do.",
    reference: "Ephesians 2:10",
    explanation: "You are a masterpiece with a purpose. The good work you're meant to do today was prepared before you woke up."
  },
  {
    verse: "Be completely humble and gentle; be patient, bearing with one another in love.",
    reference: "Ephesians 4:2",
    explanation: "Humility and patience aren't weaknesses — they're signs of deep inner strength. Practice them intentionally today."
  },
  {
    verse: "But seek first his kingdom and his righteousness, and all these things will be given to you as well. Therefore do not worry about tomorrow, for tomorrow will worry about itself.",
    reference: "Matthew 6:33-34",
    explanation: "Today has enough on its plate. Focus on what's in front of you right now and let tomorrow wait its turn."
  },
  {
    verse: "As water reflects the face, so one's life reflects the heart.",
    reference: "Proverbs 27:19",
    explanation: "Your outer life mirrors your inner world. Take time to check in with your heart today."
  },
  {
    verse: "He has shown you, O mortal, what is good. And what does the Lord require of you? To act justly and to love mercy and to walk humbly with your God.",
    reference: "Micah 6:8",
    explanation: "The good life isn't complicated: be fair, be merciful, and stay humble. Three things to practice today."
  },
  {
    verse: "The Lord will fight for you; you need only to be still.",
    reference: "Exodus 14:14",
    explanation: "Sometimes the most powerful thing you can do is stop striving and let God handle the battle."
  },
  {
    verse: "I press on toward the goal to win the prize for which God has called me heavenward in Christ Jesus.",
    reference: "Philippians 3:14",
    explanation: "Keep your eyes on the goal. Don't let distractions or past failures slow your forward momentum."
  },
  {
    verse: "Be strong and take heart, all you who hope in the Lord.",
    reference: "Psalm 31:24",
    explanation: "Hope is not wishful thinking — it's a confident expectation that fuels your strength. Hold onto it."
  },
  {
    verse: "Each one should use whatever gift he has received to serve others, as faithful stewards of God's grace.",
    reference: "1 Peter 4:10",
    explanation: "Your unique talents aren't just for you — they're meant to bless others. How can you serve someone today?"
  },
  {
    verse: "Do not conform to the pattern of this world, but be transformed by the renewing of your mind.",
    reference: "Romans 12:2",
    explanation: "Change starts in your thinking. Challenge old patterns and let fresh perspectives reshape how you live."
  },
  {
    verse: "Two are better than one, because they have a good return for their labor.",
    reference: "Ecclesiastes 4:9",
    explanation: "Partnership multiplies your impact. Don't be too proud to collaborate and share the load."
  },
  {
    verse: "He will cover you with his feathers, and under his wings you will find refuge; his faithfulness will be your shield.",
    reference: "Psalm 91:4",
    explanation: "In times of vulnerability, you are sheltered and protected. Rest in that safety today."
  },
  {
    verse: "But those who hope in the Lord will renew their strength.",
    reference: "Isaiah 40:31a",
    explanation: "Hope isn't passive. It's the active ingredient that turns exhaustion into renewed energy."
  },
  {
    verse: "I can do all this through him who gives me strength.",
    reference: "Philippians 4:13 (NIV)",
    explanation: "This verse isn't about superhuman ability — it's about finding contentment and capability in every circumstance."
  },
  {
    verse: "Blessed is the one who perseveres under trial because, having stood the test, that person will receive the crown of life.",
    reference: "James 1:12",
    explanation: "Perseverance through difficulty isn't just survival — it's the path to the richest rewards life offers."
  },
  {
    verse: "The Lord gives wisdom; from his mouth come knowledge and understanding.",
    reference: "Proverbs 2:6",
    explanation: "Wisdom is available for the asking. Approach your decisions today with the humility to seek it."
  },
  {
    verse: "Therefore encourage one another and build each other up, just as in fact you are doing.",
    reference: "1 Thessalonians 5:11",
    explanation: "Be intentional about encouraging someone today. A simple word of affirmation can change someone's entire day."
  },
  {
    verse: "Rejoice always, pray continually, give thanks in all circumstances.",
    reference: "1 Thessalonians 5:16-18",
    explanation: "Joy, prayer, and gratitude — three habits that can transform any day from ordinary to extraordinary."
  },
  {
    verse: "And now these three remain: faith, hope and love. But the greatest of these is love.",
    reference: "1 Corinthians 13:13",
    explanation: "When everything else fades, love endures. Make it the foundation of every decision today."
  },
  {
    verse: "Do not let any unwholesome talk come out of your mouths, but only what is helpful for building others up.",
    reference: "Ephesians 4:29",
    explanation: "Before you speak, ask: is this building someone up or tearing them down? Words are tools — use them wisely."
  },
  {
    verse: "The heart of the discerning acquires knowledge, for the ears of the wise seek it out.",
    reference: "Proverbs 18:15",
    explanation: "Stay curious. The wisest people are those who never stop learning and listening."
  },
  {
    verse: "Whoever is patient has great understanding, but one who is quick-tempered displays folly.",
    reference: "Proverbs 14:29",
    explanation: "Patience is a sign of wisdom, not weakness. When you feel frustrated, slow down before you react."
  },
  {
    verse: "God is within her, she will not fall; God will help her at break of day.",
    reference: "Psalm 46:5",
    explanation: "Help often arrives right when you need it most — at the break of a new day. Hold on through the night."
  },
  {
    verse: "The Lord is my rock, my fortress and my deliverer; my God is my rock, in whom I take refuge.",
    reference: "Psalm 18:2",
    explanation: "When everything feels unstable, you have a rock-solid foundation. Stand firm on it today."
  },
  {
    verse: "Do not merely listen to the word, and so deceive yourselves. Do what it says.",
    reference: "James 1:22",
    explanation: "Knowledge without action is just information. Apply what you know today — take that step you've been putting off."
  },
  {
    verse: "Taste and see that the Lord is good; blessed is the one who takes refuge in him.",
    reference: "Psalm 34:8",
    explanation: "Don't just think about faith — experience it. Today, actively notice the goodness around you."
  },
  {
    verse: "The thief comes only to steal and kill and destroy; I have come that they may have life, and have it to the full.",
    reference: "John 10:10",
    explanation: "You were made for an abundant, full life — not just survival. Embrace the fullness available to you today."
  },
  {
    verse: "Love your neighbor as yourself.",
    reference: "Mark 12:31",
    explanation: "Notice it says 'as yourself' — loving others starts with healthy self-respect. Take care of yourself too."
  },
  {
    verse: "Enter his gates with thanksgiving and his courts with praise; give thanks to him and praise his name.",
    reference: "Psalm 100:4",
    explanation: "Start your morning with gratitude instead of complaints. Thanksgiving is the key that opens the door to joy."
  },
  {
    verse: "In their hearts humans plan their course, but the Lord establishes their steps.",
    reference: "Proverbs 16:9",
    explanation: "Plan diligently, but hold those plans loosely. Sometimes the detour is actually the destination."
  },
  {
    verse: "Teach us to number our days, that we may gain a heart of wisdom.",
    reference: "Psalm 90:12",
    explanation: "Life is short. Let that awareness make you intentional about how you spend each day."
  },
  {
    verse: "The Lord is faithful, and he will strengthen you and protect you from the evil one.",
    reference: "2 Thessalonians 3:3",
    explanation: "Faithfulness isn't just something you practice — it's something you receive. You are protected and strengthened."
  },
  {
    verse: "Let the morning bring me word of your unfailing love, for I have put my trust in you.",
    reference: "Psalm 143:8",
    explanation: "Make it a habit to look for signs of love each morning. Trust opens your eyes to see what's always been there."
  },
  {
    verse: "Whoever walks in integrity walks securely, but whoever takes crooked paths will be found out.",
    reference: "Proverbs 10:9",
    explanation: "Integrity is doing the right thing even when no one is watching. It's the foundation of a secure life."
  },
  {
    verse: "I praise you because I am fearfully and wonderfully made; your works are wonderful, I know that full well.",
    reference: "Psalm 139:14",
    explanation: "You are not an accident or an afterthought. You were crafted with purpose and wonder — believe that today."
  },
  {
    verse: "Where there is no vision, the people perish.",
    reference: "Proverbs 29:18",
    explanation: "A clear vision gives direction and energy. Know where you're headed, and your daily steps gain meaning."
  },
  {
    verse: "But the wisdom that comes from heaven is first of all pure; then peace-loving, considerate, submissive, full of mercy and good fruit, impartial and sincere.",
    reference: "James 3:17",
    explanation: "True wisdom isn't just clever — it's pure, peaceful, and merciful. Pursue that kind of wisdom today."
  },
  {
    verse: "He makes me lie down in green pastures, he leads me beside quiet waters, he refreshes my soul.",
    reference: "Psalm 23:2-3",
    explanation: "Rest isn't laziness — it's restoration. Allow yourself to be refreshed today without guilt."
  },
  {
    verse: "Be on your guard; stand firm in the faith; be courageous; be strong.",
    reference: "1 Corinthians 16:13",
    explanation: "Stay alert, stay grounded, stay brave, and stay strong. Four commands that can define your day."
  },
  {
    verse: "Whatever is true, whatever is noble, whatever is right, whatever is pure, whatever is lovely, whatever is admirable — if anything is excellent or praiseworthy — think about such things.",
    reference: "Philippians 4:8",
    explanation: "You become what you think about. Fill your mind with what is good, and your life will follow."
  },
  {
    verse: "A friend loves at all times, and a brother is born for a time of adversity.",
    reference: "Proverbs 17:17",
    explanation: "True friendship isn't fair-weather. Reach out to someone who's going through a hard time today."
  },
  {
    verse: "Even though I walk through the darkest valley, I will fear no evil, for you are with me.",
    reference: "Psalm 23:4",
    explanation: "Dark valleys are temporary passages, not permanent addresses. Keep walking — the light is ahead."
  },
  {
    verse: "The Lord is good, a refuge in times of trouble. He cares for those who trust in him.",
    reference: "Nahum 1:7",
    explanation: "In troubled times, you don't need to figure everything out. You just need to trust and take refuge."
  },
  {
    verse: "Humble yourselves before the Lord, and he will lift you up.",
    reference: "James 4:10",
    explanation: "Humility isn't thinking less of yourself — it's thinking of yourself less. That shift opens doors you never expected."
  },
  {
    verse: "For nothing will be impossible with God.",
    reference: "Luke 1:37",
    explanation: "That thing you think is impossible? Reconsider. Expand your sense of what's possible today."
  },
  {
    verse: "I have been crucified with Christ and I no longer live, but Christ lives in me.",
    reference: "Galatians 2:20",
    explanation: "Real transformation means letting go of the old self. What part of the old you needs to be released today?"
  },
  {
    verse: "A man's heart plans his way, but the Lord directs his steps.",
    reference: "Proverbs 16:9 (NKJV)",
    explanation: "Dream big and make plans, but remain flexible. Divine direction often looks like unexpected redirections."
  },
  {
    verse: "Peace I leave with you; my peace I give you. I do not give to you as the world gives. Do not let your hearts be troubled and do not be afraid.",
    reference: "John 14:27",
    explanation: "The peace being offered to you isn't dependent on circumstances. Receive it now, regardless of what's happening around you."
  },
  {
    verse: "May the God of hope fill you with all joy and peace as you trust in him.",
    reference: "Romans 15:13",
    explanation: "Joy and peace aren't things you achieve — they're things you receive through trust. Open yourself to them today."
  },
  {
    verse: "Blessed are the peacemakers, for they will be called children of God.",
    reference: "Matthew 5:9",
    explanation: "Be a bridge-builder today, not a wall-builder. Peace-making is active, courageous work."
  },
  {
    verse: "Every good and perfect gift is from above, coming down from the Father of the heavenly lights.",
    reference: "James 1:17",
    explanation: "Take time to trace your blessings back to their source. Gratitude deepens when you recognize the giver."
  },
  {
    verse: "For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.",
    reference: "John 3:16",
    explanation: "The most famous verse in the Bible reminds us: love is demonstrated through giving. How will you give today?"
  },
  {
    verse: "The steps of a good man are ordered by the Lord, and He delights in his way.",
    reference: "Psalm 37:23",
    explanation: "Your steps today are not random — they are ordered and purposeful. Walk with confidence."
  },
  {
    verse: "Do not be overcome by evil, but overcome evil with good.",
    reference: "Romans 12:21",
    explanation: "When faced with negativity, don't match it — overcome it with goodness. Be the positive force today."
  },
  {
    verse: "Therefore, since we are surrounded by such a great cloud of witnesses, let us throw off everything that hinders and the sin that so easily entangles.",
    reference: "Hebrews 12:1",
    explanation: "What's weighing you down? Identify one thing holding you back and let it go today."
  },
  {
    verse: "And let us run with perseverance the race marked out for us.",
    reference: "Hebrews 12:1b",
    explanation: "Life is a marathon, not a sprint. Focus on steady, consistent progress rather than quick results."
  },
  {
    verse: "But those who wait on the Lord shall renew their strength.",
    reference: "Isaiah 40:31 (NKJV)",
    explanation: "Waiting is not wasting time. It's the posture that allows strength to be renewed from the inside out."
  },
  {
    verse: "Set your minds on things above, not on earthly things.",
    reference: "Colossians 3:2",
    explanation: "Elevate your perspective today. When you lift your gaze higher, daily frustrations shrink in comparison."
  },
  {
    verse: "The Word became flesh and made his dwelling among us.",
    reference: "John 1:14",
    explanation: "Truth becomes real when it's lived out, not just talked about. Embody your values today."
  },
  {
    verse: "How good and pleasant it is when God's people live together in unity!",
    reference: "Psalm 133:1",
    explanation: "Unity doesn't mean uniformity — it means choosing togetherness over division. Pursue harmony today."
  },
  {
    verse: "I will say of the Lord, He is my refuge and my fortress, my God, in whom I trust.",
    reference: "Psalm 91:2",
    explanation: "Declaration shapes belief. Speak out what you trust, and watch your confidence grow."
  },
  {
    verse: "The one who calls you is faithful, and he will do it.",
    reference: "1 Thessalonians 5:24",
    explanation: "Whatever you've been called to do, the one who called you will equip you to accomplish it. Trust that."
  },
  {
    verse: "He has made everything beautiful in its time.",
    reference: "Ecclesiastes 3:11",
    explanation: "Timing matters. What feels delayed or messy right now may be exactly on schedule for something beautiful."
  },
  {
    verse: "Train up a child in the way he should go; even when he is old he will not depart from it.",
    reference: "Proverbs 22:6",
    explanation: "The habits and values you build now will echo through generations. Invest in what lasts."
  },
  {
    verse: "Greater love has no one than this: to lay down one's life for one's friends.",
    reference: "John 15:13",
    explanation: "Sacrificial love is the highest form of love. Sometimes laying down your life means laying down your preferences."
  },
  {
    verse: "For the Spirit God gave us does not make us timid, but gives us power, love and self-discipline.",
    reference: "2 Timothy 1:7 (NIV)",
    explanation: "Power, love, and self-discipline — three gifts that equip you for anything today throws at you."
  },
  {
    verse: "See, I am doing a new thing! Now it springs up; do you not perceive it?",
    reference: "Isaiah 43:19",
    explanation: "Something new is emerging in your life. Open your eyes to see it — don't cling to the old when the new is arriving."
  },
  {
    verse: "Let us hold unswervingly to the hope we profess, for he who promised is faithful.",
    reference: "Hebrews 10:23",
    explanation: "Don't waver in your hope. The promises you're standing on are backed by faithfulness itself."
  },
  {
    verse: "Your word is a lamp for my feet, a light on my path.",
    reference: "Psalm 119:105",
    explanation: "You don't need floodlights for the whole journey — just enough light for the next step. That's provided."
  },
  {
    verse: "He who finds a wife finds what is good and receives favor from the Lord.",
    reference: "Proverbs 18:22",
    explanation: "Cherish your relationships. The people close to you are blessings — don't take them for granted."
  },
  {
    verse: "The Lord makes firm the steps of the one who delights in him.",
    reference: "Psalm 37:23 (NIV)",
    explanation: "When you find joy in what matters, your steps become more sure-footed. Delight leads to direction."
  },
  {
    verse: "Be still before the Lord and wait patiently for him.",
    reference: "Psalm 37:7",
    explanation: "In a culture of instant results, patient waiting is revolutionary. Practice the discipline of stillness today."
  },
  {
    verse: "If we confess our sins, he is faithful and just and will forgive us our sins and purify us from all unrighteousness.",
    reference: "1 John 1:9",
    explanation: "You don't need to carry guilt. Honest confession leads to genuine freedom. Start fresh today."
  },
  {
    verse: "So in everything, do to others what you would have them do to you.",
    reference: "Matthew 7:12",
    explanation: "The Golden Rule is simple but powerful. Before every interaction, imagine yourself on the receiving end."
  },
  {
    verse: "The Lord himself goes before you and will be with you; he will never leave you nor forsake you.",
    reference: "Deuteronomy 31:8",
    explanation: "Whatever you're walking into today, someone has already gone ahead to prepare the way. You are not abandoned."
  },
  {
    verse: "You are the light of the world. A town built on a hill cannot be hidden.",
    reference: "Matthew 5:14",
    explanation: "Don't dim your light to make others comfortable. The world needs your brightness — shine fully today."
  },
  {
    verse: "Let your light shine before others, that they may see your good deeds and glorify your Father in heaven.",
    reference: "Matthew 5:16",
    explanation: "Your actions today can point others toward something greater. Live in a way that inspires."
  },
  {
    verse: "Now faith is confidence in what we hope for and assurance about what we do not see.",
    reference: "Hebrews 11:1",
    explanation: "Faith is not blind — it's trust with eyes wide open toward unseen realities. Walk in that confidence today."
  },
  {
    verse: "Be devoted to one another in love. Honor one another above yourselves.",
    reference: "Romans 12:10",
    explanation: "Put someone else's needs above your own today. True honor flows from genuine devotion."
  },
  {
    verse: "He heals the brokenhearted and binds up their wounds.",
    reference: "Psalm 147:3",
    explanation: "Healing is a process, not an event. If you're wounded, be patient with yourself — restoration is underway."
  },
  {
    verse: "Many are the plans in a person's heart, but it is the Lord's purpose that prevails.",
    reference: "Proverbs 19:21",
    explanation: "Plan wisely, but trust that the ultimate outcome is in hands wiser than yours."
  },
  {
    verse: "Weeping may stay for the night, but rejoicing comes in the morning.",
    reference: "Psalm 30:5",
    explanation: "Pain is temporary. If you're in a dark night, hold on — morning is on its way."
  },
  {
    verse: "The joy of the Lord is your strength.",
    reference: "Nehemiah 8:10",
    explanation: "Joy isn't just a feeling — it's a source of power. Tap into it today, even in challenging moments."
  },
  {
    verse: "With man this is impossible, but with God all things are possible.",
    reference: "Matthew 19:26",
    explanation: "Human limitations aren't the final word. What seems impossible to you is fully possible with help from above."
  },
  {
    verse: "Therefore I tell you, do not worry about your life, what you will eat or drink; or about your body, what you will wear.",
    reference: "Matthew 6:25",
    explanation: "Worry adds nothing to your life. Focus your energy on action and trust rather than anxiety."
  },
  {
    verse: "Look at the birds of the air; they do not sow or reap or store away in barns, and yet your heavenly Father feeds them. Are you not much more valuable than they?",
    reference: "Matthew 6:26",
    explanation: "If nature is provided for without worry, how much more will you be? You are valued beyond measure."
  },
  {
    verse: "He who dwells in the shelter of the Most High will rest in the shadow of the Almighty.",
    reference: "Psalm 91:1",
    explanation: "There's a place of rest and protection available to you right now. Dwell there, especially during storms."
  },
  {
    verse: "Draw near to God, and he will draw near to you.",
    reference: "James 4:8",
    explanation: "The relationship is reciprocal. Take one step toward faith today, and you'll find faith meeting you halfway."
  },
  {
    verse: "All Scripture is God-breathed and is useful for teaching, rebuking, correcting and training in righteousness.",
    reference: "2 Timothy 3:16",
    explanation: "Ancient wisdom is still relevant. Approach it not as a history book but as a practical guide for today."
  },
  {
    verse: "The Lord is compassionate and gracious, slow to anger, abounding in love.",
    reference: "Psalm 103:8",
    explanation: "Extend to yourself the same compassion and patience that is extended to you. Grace is meant to overflow."
  },
  {
    verse: "As iron sharpens iron, so one person sharpens another.",
    reference: "Proverbs 27:17 (NIV)",
    explanation: "Friction in relationships isn't always bad — sometimes it's the sharpening process. Lean into growth-producing tension."
  },
  {
    verse: "But grow in the grace and knowledge of our Lord and Savior Jesus Christ.",
    reference: "2 Peter 3:18",
    explanation: "Growth is a lifelong journey. You're never done learning, and that's a beautiful thing."
  },
  {
    verse: "The Lord is near to all who call on him, to all who call on him in truth.",
    reference: "Psalm 145:18",
    explanation: "Distance from God is never real — it's just perceived. Call out honestly and you'll find closeness."
  },
  {
    verse: "Let love and faithfulness never leave you; bind them around your neck, write them on the tablet of your heart.",
    reference: "Proverbs 3:3",
    explanation: "Love and faithfulness should be as close to you as your heartbeat. Carry them into every situation today."
  },
  {
    verse: "You intended to harm me, but God intended it for good.",
    reference: "Genesis 50:20",
    explanation: "What was meant to hurt you can be redirected for your benefit. Your setback could be your greatest setup."
  },
  {
    verse: "No weapon forged against you will prevail.",
    reference: "Isaiah 54:17",
    explanation: "Opposition will come, but it won't have the final say. Stand firm knowing that you are defended."
  },
  {
    verse: "Better a patient person than a warrior, one with self-control than one who takes a city.",
    reference: "Proverbs 16:32",
    explanation: "Self-control is the greatest kind of strength. Mastering yourself is harder — and more valuable — than conquering anything external."
  },
  {
    verse: "The earth is the Lord's, and everything in it, the world, and all who live in it.",
    reference: "Psalm 24:1",
    explanation: "Nothing truly belongs to you — it's all entrusted. Steward your resources, time, and relationships well today."
  },
  {
    verse: "From the rising of the sun to the place where it sets, the name of the Lord is to be praised.",
    reference: "Psalm 113:3",
    explanation: "From morning to evening, there's reason to praise. Let gratitude be the theme of your entire day."
  },
  {
    verse: "Whoever sows sparingly will also reap sparingly, and whoever sows generously will also reap generously.",
    reference: "2 Corinthians 9:6",
    explanation: "Generosity is an investment with guaranteed returns. Be generous with your time, talents, and resources today."
  },
  {
    verse: "Love does not delight in evil but rejoices with the truth.",
    reference: "1 Corinthians 13:6",
    explanation: "Authentic love celebrates truth, even when it's uncomfortable. Pursue honesty in all your relationships today."
  },
  {
    verse: "The Lord watches over the way of the righteous, but the way of the wicked leads to destruction.",
    reference: "Psalm 1:6",
    explanation: "Your choices determine your path. Choose integrity today, knowing that your way is being watched over."
  },
  {
    verse: "For I am the Lord your God who takes hold of your right hand and says to you, Do not fear; I will help you.",
    reference: "Isaiah 41:13",
    explanation: "Imagine a hand reaching out to hold yours through every fearful moment. That help is real and present."
  },
  {
    verse: "I have fought the good fight, I have finished the race, I have kept the faith.",
    reference: "2 Timothy 4:7",
    explanation: "The goal isn't perfection — it's faithfulness. Keep fighting, keep running, keep believing."
  },
  {
    verse: "Be angry and do not sin; do not let the sun go down on your anger.",
    reference: "Ephesians 4:26",
    explanation: "Anger itself isn't wrong — but holding onto it is destructive. Process and release it before day's end."
  },
  {
    verse: "He restores my soul. He leads me in paths of righteousness for his name's sake.",
    reference: "Psalm 23:3",
    explanation: "If your soul feels worn, restoration is available. Follow the right paths and feel your spirit renewed."
  },
  {
    verse: "Blessed are those who hunger and thirst for righteousness, for they will be filled.",
    reference: "Matthew 5:6",
    explanation: "Your desire to do what's right is not in vain. That hunger will be satisfied — keep pursuing it."
  },
  {
    verse: "Therefore, as God's chosen people, holy and dearly loved, clothe yourselves with compassion, kindness, humility, gentleness and patience.",
    reference: "Colossians 3:12",
    explanation: "Like getting dressed each morning, intentionally put on compassion and kindness. They're your daily wardrobe."
  },
  {
    verse: "Submit yourselves, then, to God. Resist the devil, and he will flee from you.",
    reference: "James 4:7",
    explanation: "Resistance to temptation starts with surrender to what's good. The order matters — submit first, then resist."
  },
  {
    verse: "Blessed is the one who trusts in the Lord, whose confidence is in him.",
    reference: "Jeremiah 17:7",
    explanation: "Confidence rooted in faith is unshakable. Build your sense of security on something that cannot fail."
  },
  {
    verse: "He will be like a tree planted by the water that sends out its roots by the stream.",
    reference: "Jeremiah 17:8",
    explanation: "Deep roots produce lasting fruit. Stay connected to what nourishes you, and you'll thrive in any season."
  },
  {
    verse: "Know that the Lord is God. It is he who made us, and we are his.",
    reference: "Psalm 100:3",
    explanation: "You belong. You are not an orphan in this universe — you were created with intention and claimed with love."
  },
  {
    verse: "Surely goodness and love will follow me all the days of my life.",
    reference: "Psalm 23:6",
    explanation: "Goodness and love are not just ahead of you — they're following you. You are pursued by good things."
  },
  {
    verse: "But you, Lord, are a compassionate and gracious God, slow to anger, abounding in love and faithfulness.",
    reference: "Psalm 86:15",
    explanation: "Model this character in your own life: be slow to anger, rich in love, and faithful in your commitments."
  },
  {
    verse: "My grace is sufficient for you, for my power is made perfect in weakness.",
    reference: "2 Corinthians 12:9",
    explanation: "Your weakness isn't a liability — it's where true power shows up most clearly. Don't hide your struggles."
  },
  {
    verse: "The Lord is righteous in all his ways and faithful in all he does.",
    reference: "Psalm 145:17",
    explanation: "Faithfulness in all things — big and small — is the standard to aspire to. Be reliable in every detail today."
  },
  {
    verse: "Therefore we do not lose heart. Though outwardly we are wasting away, yet inwardly we are being renewed day by day.",
    reference: "2 Corinthians 4:16",
    explanation: "Even when you feel depleted on the outside, renewal is happening within. Don't lose heart."
  },
  {
    verse: "For our light and momentary troubles are achieving for us an eternal glory that far outweighs them all.",
    reference: "2 Corinthians 4:17",
    explanation: "Zoom out from today's troubles. In the bigger picture, they are producing something magnificent."
  },
  {
    verse: "There is a time for everything, and a season for every activity under the heavens.",
    reference: "Ecclesiastes 3:1",
    explanation: "Whatever season you're in — growth, rest, struggle, celebration — it's the right season for right now. Honor it."
  },
  {
    verse: "A time to weep and a time to laugh, a time to mourn and a time to dance.",
    reference: "Ecclesiastes 3:4",
    explanation: "Don't rush past your emotions. Each one has its proper time and place. Feel fully whatever this moment calls for."
  },
  {
    verse: "Unless the Lord builds the house, the builders labor in vain.",
    reference: "Psalm 127:1",
    explanation: "Before diving into your projects, check your foundation. Build on what lasts, not what merely impresses."
  },
  {
    verse: "By wisdom a house is built, and through understanding it is established.",
    reference: "Proverbs 24:3",
    explanation: "Build your life thoughtfully — with wisdom and understanding, not haste. Strong foundations take time."
  },
  {
    verse: "The Lord your God is with you, the Mighty Warrior who saves.",
    reference: "Zephaniah 3:17a",
    explanation: "You have a mighty warrior in your corner. Whatever battle you face today, you face it with backup."
  },
  {
    verse: "Forget the former things; do not dwell on the past.",
    reference: "Isaiah 43:18",
    explanation: "Stop replaying old mistakes. Release the past so your hands are free to receive what's coming next."
  },
  {
    verse: "I am making a way in the wilderness and streams in the wasteland.",
    reference: "Isaiah 43:19b",
    explanation: "Even in barren, desolate seasons, a way is being carved out for you. Provision shows up in unlikely places."
  },
  {
    verse: "Blessed are the merciful, for they will be shown mercy.",
    reference: "Matthew 5:7",
    explanation: "Mercy given is mercy received. Be merciful to others today, and watch it come back to you."
  },
  {
    verse: "The Lord is slow to anger, abounding in love and forgiving sin and rebellion.",
    reference: "Numbers 14:18",
    explanation: "Forgiveness is available and abundant. Don't let shame keep you from moving forward today."
  },
  {
    verse: "Direct my footsteps according to your word; let no sin rule over me.",
    reference: "Psalm 119:133",
    explanation: "Ask for direction and freedom in the same breath. Guided steps and a free heart go hand in hand."
  },
  {
    verse: "For physical training is of some value, but godliness has value for all things.",
    reference: "1 Timothy 4:8",
    explanation: "Physical discipline matters, but don't neglect your spiritual and character training. Both build a complete life."
  },
  {
    verse: "Well done, good and faithful servant! You have been faithful with a few things; I will put you in charge of many things.",
    reference: "Matthew 25:21",
    explanation: "Faithfulness in small tasks leads to bigger opportunities. Don't despise the small beginnings — they matter."
  },
  {
    verse: "Ask and it will be given to you; seek and you will find; knock and the door will be opened to you.",
    reference: "Matthew 7:7",
    explanation: "Don't be passive about what you want. Ask boldly, seek actively, and knock persistently."
  },
  {
    verse: "Charm is deceptive, and beauty is fleeting; but a woman who fears the Lord is to be praised.",
    reference: "Proverbs 31:30",
    explanation: "Focus on developing character, not just appearance. Inner substance outlasts outer attractiveness every time."
  },
  {
    verse: "Children are a heritage from the Lord, offspring a reward from him.",
    reference: "Psalm 127:3",
    explanation: "The relationships and people in your care are precious gifts. Invest in them wholeheartedly."
  },
  {
    verse: "Who of you by worrying can add a single hour to your life?",
    reference: "Matthew 6:27",
    explanation: "Worry doesn't add — it subtracts. Replace worrying time with action or trust today."
  },
  {
    verse: "Be merciful, just as your Father is merciful.",
    reference: "Luke 6:36",
    explanation: "Extend the same grace to others that has been extended to you. Mercy is always the right response."
  },
  {
    verse: "He has told you, O man, what is good; and what does the Lord require of you but to do justice, and to love kindness, and to walk humbly with your God?",
    reference: "Micah 6:8 (ESV)",
    explanation: "Justice, kindness, humility — three simple guides for every decision you make today."
  },
  {
    verse: "For the word of God is alive and active. Sharper than any double-edged sword.",
    reference: "Hebrews 4:12",
    explanation: "Truth has the power to cut through confusion and reveal what's real. Let wisdom be sharp and active in your life."
  },
  {
    verse: "Grace and peace to you from God our Father and from the Lord Jesus Christ.",
    reference: "Romans 1:7",
    explanation: "Accept grace and peace as your greeting today. They're offered freely — just receive them."
  },
  {
    verse: "My soul finds rest in God alone; my salvation comes from him.",
    reference: "Psalm 62:1",
    explanation: "True rest isn't about sleep — it's about where your soul finds peace. Settle into that rest today."
  },
  {
    verse: "Take delight in the Lord, and he will give you the desires of your heart.",
    reference: "Psalm 37:4 (NIV)",
    explanation: "Delight shapes desire. When you find joy in what's truly good, your desires align with your best life."
  },
  {
    verse: "You make known to me the path of life; you will fill me with joy in your presence.",
    reference: "Psalm 16:11",
    explanation: "The path of life is illuminated and joy-filled. Stay close to the source of that light today."
  },
  {
    verse: "But be sure to fear the Lord and serve him faithfully with all your heart; consider what great things he has done for you.",
    reference: "1 Samuel 12:24",
    explanation: "Before asking for more, pause to consider how much you've already been given. Gratitude fuels faithful service."
  },
  {
    verse: "The Lord is my light and my salvation; whom shall I fear? The Lord is the stronghold of my life; of whom shall I be afraid?",
    reference: "Psalm 27:1 (ESV)",
    explanation: "With light, salvation, and a stronghold on your side, fear has no foundation. Walk confidently today."
  },
  {
    verse: "In all your ways acknowledge him, and he shall direct your paths.",
    reference: "Proverbs 3:6 (NKJV)",
    explanation: "Acknowledgment precedes direction. Before you plan your route, acknowledge who's guiding the journey."
  },
  {
    verse: "Let all that you do be done in love.",
    reference: "1 Corinthians 16:14 (ESV)",
    explanation: "Let love be the why behind every what. Whatever fills your schedule today, fill it with love."
  },
  {
    verse: "Anxiety weighs down the heart, but a kind word cheers it up.",
    reference: "Proverbs 12:25",
    explanation: "You have the power to lighten someone's load today with a single kind word. Use that power."
  },
  {
    verse: "Bear one another's burdens, and so fulfill the law of Christ.",
    reference: "Galatians 6:2",
    explanation: "You don't have to carry your burdens alone, and neither does anyone else. Share the weight."
  },
  {
    verse: "Set a guard over my mouth, Lord; keep watch over the door of my lips.",
    reference: "Psalm 141:3",
    explanation: "Before speaking, pause. Not every thought needs to be verbalized. Guard your words today."
  },
  {
    verse: "Whoever guards his mouth preserves his life; he who opens wide his lips comes to ruin.",
    reference: "Proverbs 13:3",
    explanation: "Words once spoken cannot be taken back. Think before you speak — restraint is a form of wisdom."
  },
  {
    verse: "Be still, and know that I am God; I will be exalted among the nations, I will be exalted in the earth.",
    reference: "Psalm 46:10 (full)",
    explanation: "The call to stillness comes with a promise. When you stop striving, truth becomes clearer."
  },
  {
    verse: "But you are a chosen people, a royal priesthood, a holy nation, God's special possession.",
    reference: "1 Peter 2:9",
    explanation: "You are chosen and special — not because of what you do, but because of whose you are."
  },
  {
    verse: "I can do all things through Christ who strengthens me. I know what it is to be in need, and I know what it is to have plenty.",
    reference: "Philippians 4:12-13",
    explanation: "Contentment in all circumstances is the real superpower. Whether you have much or little, you can thrive."
  },
  {
    verse: "The Lord will keep you from all harm — he will watch over your life.",
    reference: "Psalm 121:7",
    explanation: "Protection isn't always visible, but it's always active. Trust that you are being watched over today."
  },
  {
    verse: "I lift up my eyes to the mountains — where does my help come from? My help comes from the Lord, the Maker of heaven and earth.",
    reference: "Psalm 121:1-2",
    explanation: "When you feel overwhelmed, look up. Your help comes from a source bigger than any mountain you face."
  },
  {
    verse: "The Lord bless you and keep you; the Lord make his face to shine upon you and be gracious to you; the Lord turn his face toward you and give you peace.",
    reference: "Numbers 6:24-26",
    explanation: "Carry this blessing with you today. You are blessed, kept, and given grace and peace."
  },
  {
    verse: "Put on the full armor of God, so that you can take your stand against the devil's schemes.",
    reference: "Ephesians 6:11",
    explanation: "Preparation matters. Equip yourself mentally and spiritually before facing the challenges of the day."
  },
  {
    verse: "Stand firm then, with the belt of truth buckled around your waist, with the breastplate of righteousness in place.",
    reference: "Ephesians 6:14",
    explanation: "Truth and integrity are your first line of defense. Put them on before anything else today."
  },
  {
    verse: "May the Lord direct your hearts into God's love and Christ's perseverance.",
    reference: "2 Thessalonians 3:5",
    explanation: "Two things to chase today: deeper love and greater perseverance. Both are gifts, not burdens."
  },
  {
    verse: "So we fix our eyes not on what is seen, but on what is unseen, since what is seen is temporary, but what is unseen is eternal.",
    reference: "2 Corinthians 4:18",
    explanation: "Don't be consumed by what's right in front of you. Keep your focus on what truly lasts."
  },
  {
    verse: "Be still, and know that I am God.",
    reference: "Psalm 46:10a",
    explanation: "Five simple words that can center your entire day. Stop. Breathe. Know."
  },
  {
    verse: "The beginning of wisdom is this: Get wisdom. Though it cost all you have, get understanding.",
    reference: "Proverbs 4:7",
    explanation: "Wisdom is worth any price. Invest in learning, growing, and understanding — it pays the highest dividends."
  },
  {
    verse: "Love is patient, love is kind. It does not envy, it does not boast, it is not proud. It does not dishonor others, it is not self-seeking.",
    reference: "1 Corinthians 13:4-5",
    explanation: "Love is described by what it does, not what it feels. Practice patience and kindness as active choices today."
  },
  {
    verse: "It is not self-seeking, it is not easily angered, it keeps no record of wrongs.",
    reference: "1 Corinthians 13:5",
    explanation: "Let go of that mental tally of offenses. Keeping score in relationships always leads to losing."
  },
  {
    verse: "Love never fails.",
    reference: "1 Corinthians 13:8",
    explanation: "When everything else seems uncertain, love remains the one strategy that never fails. Lead with it."
  },
  {
    verse: "The Lord is with me; I will not be afraid. What can mere mortals do to me?",
    reference: "Psalm 118:6",
    explanation: "People's opinions don't define you. With the ultimate source of approval on your side, human judgment shrinks."
  },
  {
    verse: "Give, and it will be given to you. A good measure, pressed down, shaken together and running over.",
    reference: "Luke 6:38",
    explanation: "Generosity creates abundance. What you give away comes back multiplied — in unexpected ways."
  },
  {
    verse: "His master replied, Well done, good and faithful servant!",
    reference: "Matthew 25:23",
    explanation: "Imagine hearing these words at the end of today. What would you need to do to earn them?"
  },
  {
    verse: "Be very careful, then, how you live — not as unwise but as wise, making the most of every opportunity.",
    reference: "Ephesians 5:15-16",
    explanation: "Time is your most precious resource. Use it wisely today — be intentional with every hour."
  },
  {
    verse: "Blessed is the man who walks not in the counsel of the ungodly.",
    reference: "Psalm 1:1",
    explanation: "The advice you accept shapes your life. Choose your counselors carefully — not all opinions are equal."
  },
  {
    verse: "But his delight is in the law of the Lord, and on his law he meditates day and night.",
    reference: "Psalm 1:2",
    explanation: "What you meditate on becomes what you become. Feed your mind with wisdom throughout the day."
  },
  {
    verse: "He is like a tree planted by streams of water, which yields its fruit in season and whose leaf does not wither.",
    reference: "Psalm 1:3",
    explanation: "Rootedness produces fruitfulness. Stay connected to your source and you'll bear fruit at the right time."
  },
  {
    verse: "For the Lord God is a sun and shield; the Lord bestows favor and honor.",
    reference: "Psalm 84:11",
    explanation: "Light to guide you and a shield to protect you — both are yours today. Walk in favor and honor."
  },
  {
    verse: "How great is the love the Father has lavished on us, that we should be called children of God!",
    reference: "1 John 3:1",
    explanation: "The love poured out on you is lavish — not measured or rationed. You are deeply, extravagantly loved."
  },
  {
    verse: "The Lord is my helper; I will not be afraid. What can anyone do to me?",
    reference: "Hebrews 13:6",
    explanation: "Fear of others' actions diminishes when you realize the ultimate helper is on your side."
  },
  {
    verse: "Come now, let us settle the matter. Though your sins are like scarlet, they shall be as white as snow.",
    reference: "Isaiah 1:18",
    explanation: "No stain is too deep to be cleaned. Whatever is weighing on your conscience, forgiveness is available."
  },
  {
    verse: "Be transformed by the renewing of your mind. Then you will be able to test and approve what God's will is.",
    reference: "Romans 12:2b",
    explanation: "A renewed mind leads to clearer discernment. Work on your thinking, and clarity follows."
  },
  {
    verse: "Whatever you do, do it all for the glory of God.",
    reference: "1 Corinthians 10:31",
    explanation: "From mundane tasks to major projects, every action can be an act of worship. Do everything with intention."
  },
  {
    verse: "Keep your lives free from the love of money and be content with what you have.",
    reference: "Hebrews 13:5",
    explanation: "Contentment is not about having less — it's about needing less. Practice grateful satisfaction today."
  },
  {
    verse: "The Lord is my strength and my song; he has given me victory.",
    reference: "Exodus 15:2",
    explanation: "Your strength and your joy come from the same source. Let that source fuel both today."
  },
  {
    verse: "Clothe yourselves with the Lord Jesus Christ, and do not think about how to gratify the desires of the flesh.",
    reference: "Romans 13:14",
    explanation: "Identity determines behavior. When you know who you are, you make better choices about what you do."
  },
  {
    verse: "For the wages of sin is death, but the gift of God is eternal life in Christ Jesus our Lord.",
    reference: "Romans 6:23",
    explanation: "Consequences are real, but so are gifts. Choose the free gift of grace over the costly path of shortcuts."
  },
  {
    verse: "Be wise in the way you act toward outsiders; make the most of every opportunity.",
    reference: "Colossians 4:5",
    explanation: "How you treat people outside your circle reveals your true character. Be wise and intentional in every interaction."
  },
  {
    verse: "Let your conversation be always full of grace, seasoned with salt, so that you may know how to answer everyone.",
    reference: "Colossians 4:6",
    explanation: "Season your conversations with grace and truth. Both are needed — grace without truth is bland, truth without grace is harsh."
  },
  {
    verse: "I will never leave you nor forsake you.",
    reference: "Hebrews 13:5b",
    explanation: "Seven words that change everything. You are not abandoned, forgotten, or left behind."
  },
  {
    verse: "Through love, serve one another.",
    reference: "Galatians 5:13",
    explanation: "Freedom isn't about self-indulgence — it's about using your liberty to serve others. Serve someone today."
  },
  {
    verse: "Surely your goodness and love will follow me all the days of my life, and I will dwell in the house of the Lord forever.",
    reference: "Psalm 23:6 (full)",
    explanation: "Goodness and love are not just occasional — they follow you every single day. Walk in that assurance."
  },
  {
    verse: "I pray that the eyes of your heart may be enlightened in order that you may know the hope to which he has called you.",
    reference: "Ephesians 1:18",
    explanation: "Ask for eyes to see what you've been missing. Enlightenment often comes through a shift in perspective."
  },
  {
    verse: "Now to him who is able to do immeasurably more than all we ask or imagine, according to his power that is at work within us.",
    reference: "Ephesians 3:20",
    explanation: "Your biggest dreams are small compared to what's possible. Think bigger — and then let it exceed even that."
  },
  {
    verse: "Being confident of this, that he who began a good work in you will carry it on to completion.",
    reference: "Philippians 1:6 (NIV)",
    explanation: "Your story isn't finished. What's been started in you will be completed — trust the process."
  },
  {
    verse: "Blessed are the pure in heart, for they will see God.",
    reference: "Matthew 5:8",
    explanation: "Purity of heart means single-minded devotion to what's right. Clarity of purpose brings clarity of vision."
  },
  {
    verse: "The Lord watches over you — the Lord is your shade at your right hand.",
    reference: "Psalm 121:5",
    explanation: "In the heat of life's pressures, you have shade and shelter right beside you."
  },
  {
    verse: "He guides the humble in what is right and teaches them his way.",
    reference: "Psalm 25:9",
    explanation: "Humility is the prerequisite for guidance. The more teachable you are, the more you'll learn."
  },
  {
    verse: "Do not grieve, for the joy of the Lord is your strength.",
    reference: "Nehemiah 8:10b",
    explanation: "Joy and grief can coexist, but joy is what sustains you through the grief. Let joy be your anchor."
  },
  {
    verse: "Create in me a clean heart, O God, and renew a right spirit within me.",
    reference: "Psalm 51:10 (ESV)",
    explanation: "Inner renewal starts with an honest request. Ask for a clean slate and a right attitude today."
  },
  {
    verse: "The grass withers and the flowers fall, but the word of the Lord endures forever.",
    reference: "Isaiah 40:8",
    explanation: "Everything temporary fades. Build your life on what endures — truth, love, and purpose."
  },
  {
    verse: "Not by might nor by power, but by my Spirit, says the Lord Almighty.",
    reference: "Zechariah 4:6",
    explanation: "Stop trying to force results with sheer willpower. Real breakthroughs come through a power beyond your own."
  },
  {
    verse: "Great is the Lord and most worthy of praise; his greatness no one can fathom.",
    reference: "Psalm 145:3",
    explanation: "Some things are beyond comprehension — and that's okay. Wonder is the proper response to greatness."
  },
  {
    verse: "The boundary lines have fallen for me in pleasant places; surely I have a delightful inheritance.",
    reference: "Psalm 16:6",
    explanation: "Appreciate the boundaries and blessings in your life today. Your inheritance — your place — is pleasant."
  },
  {
    verse: "God opposes the proud but shows favor to the humble.",
    reference: "James 4:6",
    explanation: "Pride closes doors that humility opens. Approach today with a posture of learning rather than knowing."
  },
  {
    verse: "Be on your guard; stand firm in the faith; be men of courage; be strong. Do everything in love.",
    reference: "1 Corinthians 16:13-14",
    explanation: "Guard, stand, be courageous, be strong — and wrap it all in love. That's the complete formula for today."
  },
  {
    verse: "The righteous cry out, and the Lord hears them; he delivers them from all their troubles.",
    reference: "Psalm 34:17",
    explanation: "Your cries are heard. Don't suffer in silence — speak up and trust that help is on the way."
  },
  {
    verse: "And my God will meet all your needs according to the riches of his glory in Christ Jesus.",
    reference: "Philippians 4:19",
    explanation: "Your needs — not just some of them, but all of them — will be met. Trust in abundant provision."
  },
  {
    verse: "O Lord, you have searched me and known me. You know when I sit down and when I rise up.",
    reference: "Psalm 139:1-2",
    explanation: "You are fully known and still fully loved. There's no need to hide or perform."
  },
  {
    verse: "Search me, God, and know my heart; test me and know my anxious thoughts.",
    reference: "Psalm 139:23",
    explanation: "Invite honest self-examination today. Being known deeply is the first step toward real growth."
  },
  {
    verse: "For God did not send his Son into the world to condemn the world, but to save the world through him.",
    reference: "John 3:17",
    explanation: "The purpose isn't condemnation — it's salvation. Extend that same non-condemning grace to yourself and others."
  },
  {
    verse: "The path of the righteous is like the morning sun, shining ever brighter till the full light of day.",
    reference: "Proverbs 4:18",
    explanation: "Your path is getting brighter, not dimmer. Each day builds on the last toward greater clarity."
  },
  {
    verse: "A new command I give you: Love one another. As I have loved you, so you must love one another.",
    reference: "John 13:34",
    explanation: "The standard of love is not what you feel capable of but what you've been shown. Love lavishly today."
  },
  {
    verse: "Who shall separate us from the love of Christ? Shall trouble or hardship or persecution or famine or nakedness or danger or sword?",
    reference: "Romans 8:35",
    explanation: "The answer is: absolutely nothing. No circumstance can sever you from love. Rest in that unshakable reality."
  },
  {
    verse: "But God demonstrates his own love for us in this: While we were still sinners, Christ died for us.",
    reference: "Romans 5:8",
    explanation: "Love didn't wait for you to be perfect. You were loved at your worst. Extend that same grace to others."
  },
  {
    verse: "Teach me your way, Lord, that I may rely on your faithfulness; give me an undivided heart.",
    reference: "Psalm 86:11",
    explanation: "An undivided heart — focused, committed, wholehearted. That's the goal for today."
  },
  {
    verse: "Make every effort to live in peace with everyone and to be holy.",
    reference: "Hebrews 12:14",
    explanation: "Peace with others requires effort — it doesn't just happen. Actively pursue harmony in your relationships today."
  },
  {
    verse: "Rejoice in the Lord always. I will say it again: Rejoice!",
    reference: "Philippians 4:4",
    explanation: "Rejoicing is a choice, not a feeling. Choose it today, even if — especially if — circumstances aren't ideal."
  },
  {
    verse: "Let the peace of Christ rule in your hearts, since as members of one body you were called to peace.",
    reference: "Colossians 3:15",
    explanation: "Let peace be the umpire that calls the shots in your heart. When you're unsettled, something needs attention."
  },
  {
    verse: "Let the word of Christ dwell in you richly, teaching and admonishing one another in all wisdom.",
    reference: "Colossians 3:16",
    explanation: "Fill your mind with truth and share it generously with others. Rich inner life overflows into rich community."
  },
  {
    verse: "Arise, shine, for your light has come, and the glory of the Lord rises upon you.",
    reference: "Isaiah 60:1",
    explanation: "This is your moment to rise. Don't stay seated when your light has already arrived. Shine today."
  },
  {
    verse: "We love because he first loved us.",
    reference: "1 John 4:19",
    explanation: "Your capacity to love is not self-generated — it's a response to being loved first. Receive, then give."
  },
  {
    verse: "How precious to me are your thoughts, God! How vast is the sum of them!",
    reference: "Psalm 139:17",
    explanation: "You are thought of more than you know. The thoughts directed toward you are vast and precious."
  },
  {
    verse: "Set your minds on things above, not on earthly things.",
    reference: "Colossians 3:2 (repeat emphasis)",
    explanation: "Where you fix your attention determines your attitude. Elevate your thinking above temporary concerns."
  },
  {
    verse: "I have hidden your word in my heart that I might not sin against you.",
    reference: "Psalm 119:11",
    explanation: "What you memorize shapes what you do. Store truth in your heart as a safeguard for your actions."
  },
  {
    verse: "For the Lord gives wisdom; from his mouth come knowledge and understanding.",
    reference: "Proverbs 2:6 (ESV)",
    explanation: "Wisdom isn't earned by IQ — it's received by asking. Seek it from the ultimate source today."
  },
  {
    verse: "But whoever listens to me will live in safety and be at ease, without fear of harm.",
    reference: "Proverbs 1:33",
    explanation: "Listening leads to safety and ease. Tune in to wisdom today and let it settle your spirit."
  },
  {
    verse: "The fear of the Lord is the beginning of knowledge, but fools despise wisdom and instruction.",
    reference: "Proverbs 1:7",
    explanation: "Reverence and humility open the door to true knowledge. Stay hungry for instruction."
  },
  {
    verse: "Be kind to one another, tenderhearted, forgiving one another, as God in Christ forgave you.",
    reference: "Ephesians 4:32 (ESV)",
    explanation: "Kindness, tenderness, forgiveness — three daily practices that mirror the grace you've received."
  },
  {
    verse: "The steadfast love of the Lord never ceases; his mercies never come to an end.",
    reference: "Lamentations 3:22",
    explanation: "Steadfast love means it doesn't waver or quit. On your best day and worst day, you are loved the same."
  },
  {
    verse: "I am the vine; you are the branches. If you remain in me and I in you, you will bear much fruit; apart from me you can do nothing.",
    reference: "John 15:5",
    explanation: "Stay connected to your source. Productivity and fruitfulness flow from connection, not isolation."
  },
  {
    verse: "This is the confidence we have in approaching God: that if we ask anything according to his will, he hears us.",
    reference: "1 John 5:14",
    explanation: "Pray with confidence today. When your requests align with what's right and good, they are heard."
  },
  {
    verse: "Truly I tell you, if you have faith as small as a mustard seed, you can say to this mountain, Move from here to there, and it will move.",
    reference: "Matthew 17:20",
    explanation: "You don't need giant faith — just genuine faith. Even a tiny seed of belief can move mountains."
  },
  {
    verse: "The Lord your God will bless you in all your harvest and in all the work of your hands, and your joy will be complete.",
    reference: "Deuteronomy 16:15",
    explanation: "Blessing is promised on your work and your harvest. Put your hands to good work today and trust the results."
  },
  {
    verse: "As a father has compassion on his children, so the Lord has compassion on those who fear him.",
    reference: "Psalm 103:13",
    explanation: "Think of the most compassionate parent you know — then multiply that compassion infinitely. That's how you are seen."
  },
  {
    verse: "He will not let your foot slip — he who watches over you will not slumber.",
    reference: "Psalm 121:3",
    explanation: "Even while you sleep, you are watched over. You can rest fully knowing that protection never takes a break."
  },
  {
    verse: "The Lord is good to all; he has compassion on all he has made.",
    reference: "Psalm 145:9",
    explanation: "Goodness and compassion extend to everyone — including you. Accept that you are a recipient of divine goodness."
  },
  {
    verse: "Whoever finds their life will lose it, and whoever loses their life for my sake will find it.",
    reference: "Matthew 10:39",
    explanation: "The paradox of life: you find yourself by giving yourself away. Live generously and watch your life expand."
  },
  {
    verse: "For the Lord your God is the one who goes with you to fight for you against your enemies to give you victory.",
    reference: "Deuteronomy 20:4",
    explanation: "You don't fight alone. Whatever battle is in front of you today, victory is being fought for on your behalf."
  },
  {
    verse: "He gives power to the faint, and to him who has no might he increases strength.",
    reference: "Isaiah 40:29 (ESV)",
    explanation: "When your own reserves run dry, a fresh supply of strength is available. Ask for it today."
  },
  {
    verse: "Do not withhold good from those to whom it is due, when it is in your power to act.",
    reference: "Proverbs 3:27",
    explanation: "If you can help someone today, do it. Don't delay doing good when you have the ability."
  },
  {
    verse: "Blessed are those who mourn, for they will be comforted.",
    reference: "Matthew 5:4",
    explanation: "Grief is not the end of the story — comfort follows. Allow yourself to mourn, knowing comfort is promised."
  },
  {
    verse: "If God is for us, who can be against us?",
    reference: "Romans 8:31",
    explanation: "The most powerful force in the universe is on your side. Let that truth redefine your confidence today."
  },
  {
    verse: "Be completely humble and gentle; be patient, bearing with one another in love. Make every effort to keep the unity of the Spirit through the bond of peace.",
    reference: "Ephesians 4:2-3",
    explanation: "Unity takes effort — it requires humility, gentleness, patience, and love working together."
  },
  {
    verse: "So then, just as you received Christ Jesus as Lord, continue to live your lives in him, rooted and built up in him, strengthened in the faith.",
    reference: "Colossians 2:6-7",
    explanation: "Growth is about going deeper, not just wider. Strengthen your roots today."
  },
  {
    verse: "Whoever is faithful in very little is also faithful in much.",
    reference: "Luke 16:10",
    explanation: "Don't despise small responsibilities. How you handle the little things reveals how you'll handle the big ones."
  },
  {
    verse: "In the beginning God created the heavens and the earth.",
    reference: "Genesis 1:1",
    explanation: "Everything starts with a beginning. Whatever you're starting today, know that creation is in your nature."
  },
  {
    verse: "So God created mankind in his own image, in the image of God he created them.",
    reference: "Genesis 1:27",
    explanation: "You carry the image of the Creator. That means creativity, purpose, and value are woven into your very being."
  },
  {
    verse: "The Lord God said, It is not good for the man to be alone.",
    reference: "Genesis 2:18",
    explanation: "Connection is not optional — it's essential. Reach out to someone today. You weren't made for isolation."
  },
  {
    verse: "Trust in the Lord forever, for the Lord, the Lord himself, is the Rock eternal.",
    reference: "Isaiah 26:4",
    explanation: "Trends change, feelings fluctuate, but you have an eternal rock to stand on. Build your trust there."
  },
  {
    verse: "Great peace have those who love your law, and nothing can make them stumble.",
    reference: "Psalm 119:165",
    explanation: "A life built on truth enjoys a peace that isn't easily disturbed. Love wisdom and stability follows."
  },
  {
    verse: "The Lord will guide you always; he will satisfy your needs in a sun-scorched land.",
    reference: "Isaiah 58:11",
    explanation: "Even in life's deserts — dry, barren seasons — guidance and satisfaction are promised. You won't be left thirsty."
  },
  {
    verse: "So whether you eat or drink or whatever you do, do it all for the glory of God.",
    reference: "1 Corinthians 10:31 (full)",
    explanation: "Even the most ordinary activities become sacred when done with purpose. Eat, drink, work — all for glory."
  },
  {
    verse: "Trust in him at all times, you people; pour out your hearts to him, for God is our refuge.",
    reference: "Psalm 62:8",
    explanation: "Don't filter your prayers — pour out your raw, honest heart. God can handle your unedited emotions."
  },
  {
    verse: "For the Son of Man came to seek and to save the lost.",
    reference: "Luke 19:10",
    explanation: "If you've ever felt lost, know that someone is actively looking for you. You are sought after."
  },
  {
    verse: "Then you will know the truth, and the truth will set you free.",
    reference: "John 8:32",
    explanation: "Truth is liberating, even when it's uncomfortable. Pursue honesty in every area of your life today."
  },
  {
    verse: "I am the way and the truth and the life.",
    reference: "John 14:6",
    explanation: "When you're lost, confused, or feeling lifeless, there's a path forward. Follow the way, embrace truth, and choose life."
  },
  {
    verse: "The heavens declare the glory of God; the skies proclaim the work of his hands.",
    reference: "Psalm 19:1",
    explanation: "Look up today. Creation itself is a daily reminder that something magnificent is at work."
  },
  {
    verse: "Teach me to do your will, for you are my God; may your good Spirit lead me on level ground.",
    reference: "Psalm 143:10",
    explanation: "Ask to be led today — not on the easiest path, but on level ground where you can walk steadily."
  },
  {
    verse: "How sweet are your words to my taste, sweeter than honey to my mouth!",
    reference: "Psalm 119:103",
    explanation: "Truth can be sweet when received with an open heart. Savor the wisdom that comes your way today."
  },
  {
    verse: "I have set the Lord always before me. Because he is at my right hand, I will not be shaken.",
    reference: "Psalm 16:8",
    explanation: "What you keep in front of you determines your stability. Place faith at the center and you won't be shaken."
  },
  {
    verse: "The righteous will flourish like a palm tree, they will grow like a cedar of Lebanon.",
    reference: "Psalm 92:12",
    explanation: "Flourishing takes time — palm trees and cedars don't grow overnight. Be patient with your growth."
  },
  {
    verse: "Blessed is she who has believed that the Lord would fulfill his promises to her!",
    reference: "Luke 1:45",
    explanation: "Belief in promises is itself a blessing. What promises are you standing on today? Keep believing."
  },
  {
    verse: "But blessed is the one who trusts in the Lord, whose confidence is in him.",
    reference: "Jeremiah 17:7 (NIV)",
    explanation: "Blessed and trusting go hand in hand. Place your confidence in what cannot fail."
  },
  {
    verse: "I will praise you, Lord, with all my heart; I will tell of all the marvelous things you have done.",
    reference: "Psalm 9:1",
    explanation: "Wholehearted praise transforms your perspective. Recount the good things in your life today."
  },
  {
    verse: "He who gathers crops in summer is a prudent son, but he who sleeps during harvest is a disgraceful son.",
    reference: "Proverbs 10:5",
    explanation: "There's a time to work and a time to rest. Know the difference and act accordingly today."
  },
  {
    verse: "It is the Lord who goes before you. He will be with you; he will not leave you or forsake you. Do not fear or be dismayed.",
    reference: "Deuteronomy 31:8 (ESV)",
    explanation: "Someone has already scouted ahead of you. Whatever you face today has been anticipated and prepared for."
  },
  {
    verse: "For my yoke is easy and my burden is light.",
    reference: "Matthew 11:30",
    explanation: "If what you're carrying feels crushing, you may be carrying more than you were meant to. Lighten the load."
  },
  {
    verse: "The Lord will fulfill his purpose for me; your steadfast love, O Lord, endures forever.",
    reference: "Psalm 138:8",
    explanation: "Your purpose will be fulfilled. Steadfast love ensures it. Keep moving forward with that confidence."
  },
  {
    verse: "Brothers and sisters, I do not consider myself yet to have taken hold of it. But one thing I do: Forgetting what is behind and straining toward what is ahead.",
    reference: "Philippians 3:13",
    explanation: "Don't let yesterday's failures or successes define today. Press forward — the best is still ahead."
  },
  {
    verse: "When I am afraid, I put my trust in you.",
    reference: "Psalm 56:3",
    explanation: "Fear and trust can coexist. You don't need to stop being afraid to start trusting. Just choose trust."
  },
  {
    verse: "As the deer pants for streams of water, so my soul pants for you, my God.",
    reference: "Psalm 42:1",
    explanation: "What does your soul thirst for today? Direct that longing toward what truly satisfies."
  },
  {
    verse: "And without faith it is impossible to please God, because anyone who comes to him must believe that he exists and that he rewards those who earnestly seek him.",
    reference: "Hebrews 11:6",
    explanation: "Faith is the starting point for everything meaningful. Believe and seek earnestly today."
  },
  {
    verse: "O Lord, you are my God; I will exalt you and praise your name, for in perfect faithfulness you have done wonderful things.",
    reference: "Isaiah 25:1",
    explanation: "Look back at the wonderful things already done in your life. Praise fuels faith for what's ahead."
  },
  {
    verse: "Blessed are the poor in spirit, for theirs is the kingdom of heaven.",
    reference: "Matthew 5:3",
    explanation: "Spiritual humility — knowing you need help — is the gateway to receiving everything. Embrace your need."
  },
  {
    verse: "Open my eyes that I may see wonderful things from your law.",
    reference: "Psalm 119:18",
    explanation: "Ask for fresh eyes today. There are wonders hiding in plain sight that you haven't noticed yet."
  },
  {
    verse: "The lot is cast into the lap, but its every decision is from the Lord.",
    reference: "Proverbs 16:33",
    explanation: "Even what seems random is purposeful. Trust that the outcomes of your decisions are guided."
  },
  {
    verse: "In quietness and trust is your strength.",
    reference: "Isaiah 30:15",
    explanation: "Strength isn't always loud and forceful. Sometimes the strongest thing you can do is be quiet and trust."
  },
  {
    verse: "May he give you the desire of your heart and make all your plans succeed.",
    reference: "Psalm 20:4",
    explanation: "Receive this blessing today. May your heart's true desires and well-laid plans come to fruition."
  },
  {
    verse: "The Lord is a refuge for the oppressed, a stronghold in times of trouble.",
    reference: "Psalm 9:9",
    explanation: "If you feel pressed on every side, there's a stronghold waiting. Take refuge in what is solid and unmovable."
  },
  {
    verse: "For I am persuaded that neither death nor life, nor angels nor principalities nor powers, nor things present nor things to come, nor height nor depth, nor any other created thing, shall be able to separate us from the love of God.",
    reference: "Romans 8:38-39 (NKJV)",
    explanation: "Nothing in existence — past, present, or future — has the power to separate you from love. Absolutely nothing."
  },
  {
    verse: "The wise in heart accept commands, but a chattering fool comes to ruin.",
    reference: "Proverbs 10:8",
    explanation: "Be quick to listen and slow to speak. Wisdom accepts instruction while foolishness keeps talking."
  },
  {
    verse: "Whoever gives heed to instruction prospers, and blessed is the one who trusts in the Lord.",
    reference: "Proverbs 16:20",
    explanation: "Instruction and trust — two ingredients for a prosperous life. Seek both actively today."
  },
  {
    verse: "You will keep in perfect peace those whose minds are steadfast, because they trust in you.",
    reference: "Isaiah 26:3",
    explanation: "Perfect peace comes from a steadfast mind. When your thoughts wander to worry, redirect them to trust."
  },
  {
    verse: "But the Lord stood at my side and gave me strength.",
    reference: "2 Timothy 4:17",
    explanation: "Even when others weren't there, strength was provided. You have backup even when the room feels empty."
  },
  {
    verse: "Commit your way to the Lord; trust in him and he will do this: He will make your righteous reward shine like the dawn.",
    reference: "Psalm 37:5-6",
    explanation: "Commitment and trust produce radiant results. Your reward will shine — keep committing and trusting."
  },
  {
    verse: "Great is our Lord and mighty in power; his understanding has no limit.",
    reference: "Psalm 147:5",
    explanation: "Whatever you're struggling to understand, there's an unlimited understanding available to you. Tap into it."
  },
  {
    verse: "The wise woman builds her house, but with her own hands the foolish one tears hers down.",
    reference: "Proverbs 14:1",
    explanation: "Every action either builds or tears down. Be intentional about building up your life and relationships today."
  },
  {
    verse: "The Lord has done great things for us, and we are filled with joy.",
    reference: "Psalm 126:3",
    explanation: "Pause to remember the great things already done in your life. Joy flows naturally from grateful remembrance."
  },
  {
    verse: "May the words of my mouth and this meditation of my heart be pleasing in your sight, Lord, my Rock and my Redeemer.",
    reference: "Psalm 19:14",
    explanation: "Let this be your morning prayer: may your words and thoughts be worthy of who you want to become."
  },
  {
    verse: "It is God who arms me with strength and keeps my way secure.",
    reference: "Psalm 18:32",
    explanation: "Your security doesn't come from your own abilities but from being armed with strength beyond yourself."
  },
  {
    verse: "Therefore do not worry about tomorrow, for tomorrow will worry about itself. Each day has enough trouble of its own.",
    reference: "Matthew 6:34",
    explanation: "Stay in today. Tomorrow's challenges will have tomorrow's resources. Focus on what's right in front of you."
  },
  {
    verse: "A generous person will prosper; whoever refreshes others will be refreshed.",
    reference: "Proverbs 11:25",
    explanation: "Generosity is a boomerang — what you give away comes back to refresh you. Be generous today."
  },
  {
    verse: "Guard your heart above all else, for it determines the course of your life.",
    reference: "Proverbs 4:23 (NLT)",
    explanation: "Your heart is mission control. What you guard it with — or leave it exposed to — shapes everything."
  },
  {
    verse: "Be completely humble and gentle; be patient, bearing with one another in love.",
    reference: "Ephesians 4:2 (NIV)",
    explanation: "Humility, gentleness, and patience aren't passive — they're powerful acts of love that hold relationships together."
  },
  {
    verse: "So then, brothers and sisters, stand firm and hold fast to the teachings we passed on to you.",
    reference: "2 Thessalonians 2:15",
    explanation: "In shifting times, stand firm on what you know to be true. Don't let popular opinion blow you off course."
  },
  {
    verse: "He heals the brokenhearted and binds up their wounds.",
    reference: "Psalm 147:3 (NIV)",
    explanation: "If you're carrying a broken heart today, healing is underway. Your wounds are being tended to."
  },
  {
    verse: "But seek the welfare of the city where I have sent you, and pray to the Lord on its behalf.",
    reference: "Jeremiah 29:7",
    explanation: "Bloom where you're planted. Invest in the wellbeing of your community — your flourishing is tied to theirs."
  },
  {
    verse: "The light shines in the darkness, and the darkness has not overcome it.",
    reference: "John 1:5",
    explanation: "No matter how dark things seem, light always wins. Be a carrier of that light today."
  },
  {
    verse: "Consider it pure joy, my brothers and sisters, whenever you face trials of many kinds.",
    reference: "James 1:2",
    explanation: "Joy in trials isn't denial — it's perspective. Knowing that trials produce growth changes how you face them."
  },
  {
    verse: "Because you know that the testing of your faith produces perseverance. Let perseverance finish its work so that you may be mature and complete, not lacking anything.",
    reference: "James 1:3-4",
    explanation: "Let the process complete its work. Don't shortcut your growth — maturity requires patience."
  },
  {
    verse: "The Lord your God is gracious and compassionate. He will not turn his face from you if you return to him.",
    reference: "2 Chronicles 30:9",
    explanation: "It's never too late to return, restart, or begin again. Grace is always waiting with open arms."
  },
  {
    verse: "He satisfies the thirsty and fills the hungry with good things.",
    reference: "Psalm 107:9",
    explanation: "Whatever you're hungry or thirsty for today — purpose, love, direction — satisfaction is available."
  },
  {
    verse: "The Lord is on my side; I will not fear.",
    reference: "Psalm 118:6 (ESV)",
    explanation: "When the ultimate power is on your side, what is there to fear? Walk with courage today."
  },
  {
    verse: "The Lord your God in your midst, the Mighty One, will save; He will rejoice over you with gladness, He will quiet you with His love.",
    reference: "Zephaniah 3:17 (NKJV)",
    explanation: "You are rejoiced over and quieted by love. Let that truth still the noise in your soul today."
  },
  {
    verse: "How abundant are the good things that you have stored up for those who fear you.",
    reference: "Psalm 31:19",
    explanation: "Good things are stored up for you — not just a few, but abundantly. Trust in the goodness that's coming."
  },
  {
    verse: "Though an army besiege me, my heart will not fear; though war break out against me, even then I will be confident.",
    reference: "Psalm 27:3",
    explanation: "Confidence in the face of overwhelming odds comes from knowing who stands with you. Be bold today."
  },
  {
    verse: "Love the Lord your God with all your heart and with all your soul and with all your mind and with all your strength.",
    reference: "Mark 12:30",
    explanation: "Wholehearted devotion — heart, soul, mind, strength — is the foundation for everything else. Go all in today."
  },
];

/**
 * Get the Bible verse for a given date. Deterministic — same date always returns same verse.
 */
export function getVerseForDate(date) {
  const start = new Date(date.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((date - start) / (1000 * 60 * 60 * 24));
  return VERSES[dayOfYear % VERSES.length];
}
