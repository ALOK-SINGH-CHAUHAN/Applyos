"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BulletListIconButton = exports.DeleteIconButton = exports.MoveIconButton = exports.ShowIconButton = void 0;
const Button_1 = require("components/Button");
const outline_1 = require("@heroicons/react/24/outline");
const ShowIconButton = ({ show, setShow, }) => {
    const tooltipText = show ? "Hide section" : "Show section";
    const onClick = () => {
        setShow(!show);
    };
    const Icon = show ? outline_1.EyeIcon : outline_1.EyeSlashIcon;
    return (<Button_1.IconButton onClick={onClick} tooltipText={tooltipText}>
      <Icon className="h-6 w-6 text-gray-400" aria-hidden="true"/>
      <span className="sr-only">{tooltipText}</span>
    </Button_1.IconButton>);
};
exports.ShowIconButton = ShowIconButton;
const MoveIconButton = ({ type, size = "medium", onClick, }) => {
    const tooltipText = type === "up" ? "Move up" : "Move down";
    const sizeClassName = size === "medium" ? "h-6 w-6" : "h-4 w-4";
    const Icon = type === "up" ? outline_1.ArrowSmallUpIcon : outline_1.ArrowSmallDownIcon;
    return (<Button_1.IconButton onClick={() => onClick(type)} tooltipText={tooltipText} size={size}>
      <Icon className={`${sizeClassName} text-gray-400`} aria-hidden="true"/>
      <span className="sr-only">{tooltipText}</span>
    </Button_1.IconButton>);
};
exports.MoveIconButton = MoveIconButton;
const DeleteIconButton = ({ onClick, tooltipText, }) => {
    return (<Button_1.IconButton onClick={onClick} tooltipText={tooltipText} size="small">
      <outline_1.TrashIcon className="h-4 w-4 text-gray-400" aria-hidden="true"/>
      <span className="sr-only">{tooltipText}</span>
    </Button_1.IconButton>);
};
exports.DeleteIconButton = DeleteIconButton;
const BulletListIconButton = ({ onClick, showBulletPoints, }) => {
    const tooltipText = showBulletPoints
        ? "Hide bullet points"
        : "Show bullet points";
    return (<Button_1.IconButton onClick={() => onClick(!showBulletPoints)} tooltipText={tooltipText} size="small" className={showBulletPoints ? "!bg-sky-100" : ""}>
      <outline_1.ListBulletIcon className={`h-4 w-4 ${showBulletPoints ? "text-gray-700" : "text-gray-400"}`} aria-hidden="true"/>
      <span className="sr-only">{tooltipText}</span>
    </Button_1.IconButton>);
};
exports.BulletListIconButton = BulletListIconButton;
