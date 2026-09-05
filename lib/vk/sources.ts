export type VkCommunity = {
  id: string;
  /** Числовой id сообщества без минуса. */
  gid: number;
  screenName: string;
  title: string;
  shortTitle: string;
  url: string;
};

export const vkCommunities: VkCommunity[] = [
  {
    id: "irit",
    gid: 240801705,
    screenName: "iot_irit_2026",
    title: "Первый курс ИРИТ-РТФ УрФУ",
    shortTitle: "ИРИТ-РТФ",
    url: "https://vk.ru/iot_irit_2026",
  },
  {
    id: "sport",
    gid: 76308265,
    screenName: "sporturfu",
    title: "Спорт УрФУ",
    shortTitle: "Спорт",
    url: "https://vk.ru/sporturfu",
  },
];

export type VkEvent = {
  id: string;
  communityId: string;
  communityTitle: string;
  communityUrl: string;
  text: string;
  title: string;
  publishedAt: number;
  dateLabel: string;
  imageUrl?: string;
  postUrl: string;
};

export function getCommunity(id: string): VkCommunity | undefined {
  return vkCommunities.find((item) => item.id === id);
}
