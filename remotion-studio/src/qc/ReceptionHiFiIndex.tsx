import React from "react";
import {Composition, registerRoot} from "remotion";
import {ReceptionHiFiScene} from "../scenes/ReceptionHiFi";

const QCRoot: React.FC = () => <Composition id="ReceptionHiFiQC" component={ReceptionHiFiScene} durationInFrames={902} fps={30} width={1920} height={1080} />;
registerRoot(QCRoot);
