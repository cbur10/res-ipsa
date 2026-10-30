const pick = (a: string[]) => a[Math.floor(Math.random() * a.length)];
export const lines = {
  home: ["Morning, counselor. Court's in session whenever you are.", "Ten minutes today beats ten hours the night before. Ask any beagle.", "I sniffed out today's route. Smells like hearsay.", "No hearts, no lives, no limits. Just you and the rules. Let's go.", "The law won't learn itself. Trust me, I've watched it try."],
  right: ["Sustained! That one's going in the permanent record.", "Nailed it. The court is impressed. The beagle is more impressed.", "Textbook. Literally. I checked.", "Objection? Overruled. You're on fire.", "Good dog. I mean, good lawyer."],
  wrong: ["Close! That's exactly why we practice. We'll circle back to it.", "Not quite, but now you'll never forget it. That's how this works.", "Overruled, gently. Read the why, then we'll get it next time.", "Even judges get reversed. Shake it off.", "Mistakes are just practice wearing a disguise. You've got this."],
  done: ["Court adjourned. You earned that treat.", "That's a wrap. Future you says thanks.", "Case closed. I'll keep the files warm for tomorrow."],
  roundDone: ["Every stop visited! Stamp time. 🐾", "Full rounds! I'd wag harder but I'm on duty."],
  rematch: ["Quick rematch on the ones that got away. No pressure.", "Round two. They won't fool you twice."],
  boss: ["Boss battle! Gil's warming up the gavel.", "Big case. Deep breath. You've done the reading."],
  map: ["All aboard! The UBE Capital is open. The rest are still under construction. Hard hat recommended."],
};
export const say = (k: keyof typeof lines) => pick(lines[k]);
