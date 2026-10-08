import React from 'react';
import {Composition, Folder} from 'remotion';
import {PlanScene} from './scenes/Plan';
import {ReceptionScene} from './scenes/Reception';
import {AeTargetHiFiScene} from './scenes/AeTargetHiFi';
import {ReceptionHiFiScene} from './scenes/ReceptionHiFi';
import {PlanHiFiScene} from './scenes/PlanHiFi';

export const RemotionRoot: React.FC = () => <>
  <Folder name="Tourism-AI-Engine">
    <Composition
      id="TourismAIEngine"
      component={AeTargetHiFiScene}
      width={1254}
      height={720}
      fps={24}
      durationInFrames={121}
    />
  </Folder>
  <Folder name="Wenshu-Product-Demos">
    <Composition
      id="ReceptionDemo"
      component={ReceptionScene}
      width={1920}
      height={1080}
      fps={30}
      durationInFrames={902}
    />
    <Composition
      id="PlanGenerationDemo"
      component={PlanScene}
      width={1920}
      height={1080}
      fps={30}
      durationInFrames={961}
    />
    <Composition
      id="ReceptionHiFi"
      component={ReceptionHiFiScene}
      width={1920}
      height={1080}
      fps={30}
      durationInFrames={902}
    />
    <Composition
      id="PlanHiFi"
      component={PlanHiFiScene}
      width={1920}
      height={1080}
      fps={30}
      durationInFrames={961}
    />
  </Folder>
</>;
