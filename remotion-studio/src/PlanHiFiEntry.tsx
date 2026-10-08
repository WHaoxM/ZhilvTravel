import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {PlanHiFiScene} from './scenes/PlanHiFi';

const PlanHiFiRoot: React.FC = () => <Composition
  id="PlanHiFi"
  component={PlanHiFiScene}
  width={1920}
  height={1080}
  fps={30}
  durationInFrames={961}
/>;

registerRoot(PlanHiFiRoot);
