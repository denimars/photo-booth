import type { Sticker, StickerId } from "$lib/types";

import crownSvg from "$lib/../assets/stickers/crown.svg";
import heartSvg from "$lib/../assets/stickers/heart.svg";
import starSvg from "$lib/../assets/stickers/star.svg";
import partyHatSvg from "$lib/../assets/stickers/party-hat.svg";
import sunglassesSvg from "$lib/../assets/stickers/sunglasses.svg";
import mustacheSvg from "$lib/../assets/stickers/mustache.svg";
import lipsSvg from "$lib/../assets/stickers/lips.svg";
import speechBubbleSvg from "$lib/../assets/stickers/speech-bubble.svg";
import bowSvg from "$lib/../assets/stickers/bow.svg";
import sparkleSvg from "$lib/../assets/stickers/sparkle.svg";

export const stickers: Sticker[] = [
  { id: "crown", name: "Crown", src: crownSvg },
  { id: "heart", name: "Heart", src: heartSvg },
  { id: "star", name: "Star", src: starSvg },
  { id: "party-hat", name: "Party Hat", src: partyHatSvg },
  { id: "sunglasses", name: "Sunglasses", src: sunglassesSvg },
  { id: "mustache", name: "Mustache", src: mustacheSvg },
  { id: "lips", name: "Lips", src: lipsSvg },
  { id: "speech-bubble", name: "Speech Bubble", src: speechBubbleSvg },
  { id: "bow", name: "Bow", src: bowSvg },
  { id: "sparkle", name: "Sparkle", src: sparkleSvg },
];

export function getStickerById(id: StickerId): Sticker | undefined {
  return stickers.find((s) => s.id === id);
}
