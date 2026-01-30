
export interface ProjectStage {
  id: string;
  title: string;
  description: string;
  color: string;
}

export interface RoadmapData {
  title: string;
  description: string;
  stages: ProjectStage[];
}

export enum PathType {
  VALLEY = 'VALLEY',
  PEAK = 'PEAK'
}
