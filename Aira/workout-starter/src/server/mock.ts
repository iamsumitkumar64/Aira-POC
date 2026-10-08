import { serializeStatement } from '../shared/openui/serialize.js';
import type { RequestData, Turn } from '../shared/contracts.js';
import { ScreenDocument } from '../shared/openui/document.js';

const workoutFixture = `root = Screens([s_warmup, s_hiit, s_rest, s_core, s_cooldown], s_warmup)
s_warmup = Screen([p1_badge, p1_prog, p1_title, p1_timer, p1_stat, p1_cue, p1_tips, p1_actions])
p1_badge = Badge("PHASE 1 · WARM-UP", "info")
p1_prog = ProgressBar(1, 5, "Step 1 of 5: Dynamic Activation")
p1_title = Text("Arm Circles & High Knees", "title")
p1_timer = Timer("Dynamic Warm-up Timer", 30)
p1_stat = StatCard("Light Tempo", "Pacing Target", "Elevate heart rate gradually")
p1_cue = Cue("Welcome to your session! Start with fluid arm circles and gentle high knees to get blood pumping.")
p1_tips = Text("Focus on deep rhythmic breathing through your nose.", "body")
p1_actions = FollowUps(["Ready for Circuit", "Add 15s Warm-up", "Scale down"])
s_hiit = Screen([p2_badge, p2_prog, p2_title, p2_timer, p2_stat1, p2_stat2, p2_alert, p2_cue, p2_actions])
p2_badge = Badge("PHASE 2 · INTERVAL CIRCUIT", "warning")
p2_prog = ProgressBar(2, 5, "Step 2 of 5: Bodyweight Squats")
p2_title = Text("Bodyweight Power Squats", "title")
p2_timer = Timer("Interval Work Timer", 45)
p2_stat1 = StatCard("15 Reps", "Target Volume", "3 seconds eccentric drop")
p2_stat2 = StatCard("Zone 3-4", "Target Heart Rate", "High aerobic threshold")
p2_alert = Alert("warning", "Form checkpoint: Drive through heels, chest proud, avoid knees caving inward.")
p2_cue = Cue("Interval time! Sink deep into those squats and explode up. Keep your core tight and maintain constant rhythm.")
p2_actions = FollowUps(["Next Exercise", "I'm tired", "Make it harder", "Need rest"])
s_rest = Screen([p3_badge, p3_prog, p3_title, p3_timer, p3_stat, p3_cue, p3_note, p3_actions])
p3_badge = Badge("PHASE 3 · ACTIVE RECOVERY", "success")
p3_prog = ProgressBar(3, 5, "Step 3 of 5: Recovery Interval")
p3_title = Text("Hydrate & Reset", "title")
p3_timer = Timer("Rest Interval Timer", 30)
p3_stat = StatCard("Down to 110 BPM", "Target Heart Rate Recovery", "Nasal breathing recovery")
p3_cue = Cue("Awesome work on that interval! Sip water and take long deep exhales to bring your heart rate down.")
p3_note = Text("Active recovery helps clear metabolic fatigue before the next round.", "description")
p3_actions = FollowUps(["Skip Rest", "Extend Rest +15s", "Next Round"])
s_core = Screen([p4_badge, p4_prog, p4_title, p4_timer, p4_stat, p4_list, p4_cue, p4_actions])
p4_badge = Badge("PHASE 4 · CORE FINISHER", "danger")
p4_prog = ProgressBar(4, 5, "Step 4 of 5: Isometric Core Lock")
p4_title = Text("Max Effort Plank Hold", "title")
p4_timer = Timer("Plank Hold Timer", 45)
p4_stat = StatCard("100% Focus", "Isometric Intensity", "Full abdominal tension")
p4_list = List([p4_item1, p4_item2, p4_item3])
p4_item1 = ListItem("Engage glutes and press through forearms", "bullet")
p4_item2 = ListItem("Keep straight neutral line from head to heels", "bullet")
p4_item3 = ListItem("Breathe steadily without holding your breath", "bullet")
p4_cue = Cue("Final endurance push! Lock your core like steel. Do not let your lower back sag. Hold strong!")
p4_actions = FollowUps(["Finished Plank", "Cool Down"])
s_cooldown = Screen([p5_badge, p5_prog, p5_title, p5_stat1, p5_stat2, p5_list, p5_cue, p5_actions])
p5_badge = Badge("SESSION COMPLETE", "success")
p5_prog = ProgressBar(5, 5, "Step 5 of 5: Workout Conquered")
p5_title = Text("Cool-Down & Mobility Stretch", "title")
p5_stat1 = StatCard("180 kcal", "Estimated Burn", "High metabolic efficiency")
p5_stat2 = StatCard("100% Completed", "Session Adherence", "All intervals conquered")
p5_list = List([p5_item1, p5_item2, p5_item3])
p5_item1 = ListItem("Hamstring & quad static stretch: 30s each side", "bullet")
p5_item2 = ListItem("Child's pose & shoulder release: 45s", "bullet")
p5_item3 = ListItem("Hydrate with 500ml water and electrolytes", "bullet")
p5_cue = Cue("You crushed today's session! Incredible focus and stamina throughout every phase. Time to stretch and refuel.")
p5_actions = FollowUps(["Restart Workout", "Export Run"])`;

export function mockTurn(request: RequestData, fixture: string): Turn {
  const last = request.messages.at(-1)?.content.trim().toLowerCase() ?? '';
  const fence = (code: string) => '```openui\n' + code + '\n```';

  if (last === 'load wiring sample' || last === '/demo') {
    return { reply: 'Wiring fixture loaded. This is deterministic, not a model interpreting your skill.\n' + fence('root = Screens([])') + '\n' + fence(fixture) };
  }

  if (['start workout', '/workout', 'start', 'workout', 'ready for circuit', 'restart workout', 'hiit'].includes(last)) {
    return { reply: 'Welcome to your AI-guided workout session! We will progress across 5 structured phases with timers and dynamic cues.\n' + fence('root = Screens([])') + '\n' + fence(workoutFixture) };
  }

  const doc = new ScreenDocument();
  if (request.state.ui_state) doc.apply(fence(request.state.ui_state));
  const screens = doc.screens;
  const index = screens.findIndex(s => s.key === doc.cursor);

  if (['i\'m tired', 'scale down', 'easier'].includes(last) && doc.program.includes('p2_timer =')) {
    return {
      reply: 'Pacing adapted! Scaled down interval work to 25 seconds and 10 reps to protect form.\n' +
        fence(serializeStatement('p2_timer', 'Timer', ['Interval Work Timer', 25]) + '\n' +
          serializeStatement('p2_stat1', 'StatCard', ['10 Reps', 'Scaled Target', 'Smooth form maintained']))
    };
  }

  if (['make it harder', 'harder', 'increase intensity'].includes(last) && doc.program.includes('p2_timer =')) {
    return {
      reply: 'Intensity elevated! Increased work interval to 60 seconds and 20 reps.\n' +
        fence(serializeStatement('p2_timer', 'Timer', ['Interval Work Timer', 60]) + '\n' +
          serializeStatement('p2_stat1', 'StatCard', ['20 Reps', 'High Volume Target', 'Explosive tempo']))
    };
  }

  if (['extend rest +15s', 'add 15s warm-up'].includes(last) && doc.program.includes('p3_timer =')) {
    return {
      reply: 'Extended recovery timer by 15 seconds. Keep breathing steadily.\n' +
        fence(serializeStatement('p3_timer', 'Timer', ['Rest Interval Timer', 45]))
    };
  }

  const nextTriggers = ['next', 'skip rest', 'next round', 'next exercise', 'finished plank', 'cool down'];
  if ((nextTriggers.includes(last) || last === 'back') && screens.length) {
    const delta = last === 'back' ? -1 : 1;
    const target = screens[Math.max(0, Math.min(screens.length - 1, index + delta))];
    return { reply: 'Advancing workout stepper.\n' + fence(`root = Screens([${screens.map(s => s.key).join(', ')}], ${target.key})`) };
  }

  if (/^change value to (\d{1,2})$/.test(last) && doc.program.includes('count1 =')) {
    const value = Number(last.match(/\d+/)![0]);
    return { reply: 'Fixture values patched under their existing names.\n' + fence(serializeStatement('count1', 'Keyword', [String(value), 'Sample value']) + '\n' + serializeStatement('count2', 'Keyword', [String(value), 'Second sample value'])) };
  }

  return { reply: 'Mock only understands /demo, /workout (or "start workout"), next, back and “change value to 6”. It does not read your skill. Edit the fixture/mock, test a local OpenUI patch in Builder tools, or explicitly enable a live provider.' };
}
