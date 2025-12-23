export interface Program {
  title: string;
  start: string;
  end: string;
  desc?: string;
  subTitle?: string;
}

export interface Channel {
  GuideNumber: string;
  GuideName: string;
  GuideId?: string;
  URL: string;
  CurrentProgram?: Program;
}
