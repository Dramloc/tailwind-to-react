import { ClassNames } from "@emotion/react";
import { Transition as HeadlessUITransition } from "@headlessui/react";

export const Transition = ({ enter, enterFrom, enterTo, leave, leaveFrom, leaveTo, ...props }) => {
  return (
    <ClassNames>
      {({ css }) => (
        <HeadlessUITransition
          enter={enter && css(enter)}
          enterFrom={enterFrom && css(enterFrom)}
          enterTo={enterTo && css(enterTo)}
          leave={leave && css(leave)}
          leaveFrom={leaveFrom && css(leaveFrom)}
          leaveTo={leaveTo && css(leaveTo)}
          {...props}
        />
      )}
    </ClassNames>
  );
};

export const TransitionChild = ({
  enter,
  enterFrom,
  enterTo,
  leave,
  leaveFrom,
  leaveTo,
  ...props
}) => {
  return (
    <ClassNames>
      {({ css }) => (
        <HeadlessUITransition.Child
          enter={enter && css(enter)}
          enterFrom={enterFrom && css(enterFrom)}
          enterTo={enterTo && css(enterTo)}
          leave={leave && css(leave)}
          leaveFrom={leaveFrom && css(leaveFrom)}
          leaveTo={leaveTo && css(leaveTo)}
          {...props}
        />
      )}
    </ClassNames>
  );
};
