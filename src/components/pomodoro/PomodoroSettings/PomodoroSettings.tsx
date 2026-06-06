"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { usePomodoro } from "@/contexts/PomodoroContext";
import { useTodo } from "@/contexts/TodoContext";
import { useRoutines } from "@/contexts/RoutinesContext";
import SegmentedControl from "@/components/ui/SegmentedControl/SegmentedControl";
import Field from "@/components/ui/Field/Field";
import TextInput from "@/components/ui/Field/TextInput";
import Select from "@/components/ui/Field/Select";
import Button from "@/components/ui/Button/Button";
import Modal from "@/components/ui/Modal/Modal";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import { clamp } from "@/utils/format";
import type { PomodoroLinkType } from "@/types/pomodoro";
import "./PomodoroSettings.scss";

const BUILTINS = [
  { name: "25 / 5", workMinutes: 25, breakMinutes: 5, cycles: 4 },
  { name: "50 / 10", workMinutes: 50, breakMinutes: 10, cycles: 4 },
];

export default function PomodoroSettings() {
  const t = useTranslations("pomodoro");
  const tc = useTranslations("common");
  const {
    config,
    setConfig,
    applyPreset,
    presets,
    addPreset,
    removePreset,
    activeName,
    running,
    link,
    setLink,
  } = usePomodoro();
  const { tasks } = useTodo();
  const { routines } = useRoutines();

  const [modalOpen, setModalOpen] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [draftWork, setDraftWork] = useState(25);
  const [draftBreak, setDraftBreak] = useState(5);
  const [draftCycles, setDraftCycles] = useState(4);

  const matches = (p: { workMinutes: number; breakMinutes: number; cycles: number }) =>
    config.workMinutes === p.workMinutes &&
    config.breakMinutes === p.breakMinutes &&
    config.cycles === p.cycles;

  const openModal = () => {
    setDraftName("");
    setDraftWork(config.workMinutes);
    setDraftBreak(config.breakMinutes);
    setDraftCycles(config.cycles);
    setModalOpen(true);
  };

  const createPreset = () => {
    if (!draftName.trim()) return;
    addPreset({
      name: draftName.trim(),
      workMinutes: clamp(draftWork, 1, 180),
      breakMinutes: clamp(draftBreak, 1, 60),
      cycles: clamp(draftCycles, 1, 12),
    });
    setModalOpen(false);
  };

  const handleLinkType = (type: PomodoroLinkType) =>
    setLink({ type, id: null, label: null });

  const handleLinkItem = (id: string) => {
    const list = link.type === "task" ? tasks : routines;
    const item = list.find((x) => x.id === id);
    const label =
      link.type === "task"
        ? (item as { title?: string } | undefined)?.title ?? null
        : (item as { name?: string } | undefined)?.name ?? null;
    setLink({ type: link.type, id: id || null, label });
  };

  const pendingTasks = tasks.filter((x) => x.status !== "completed");

  return (
    <div className="pomo-settings">
      <section className="pomo-settings__block">
        <div className="pomo-settings__head">
          <h3 className="section-title">{t("config")}</h3>
          <Button
            size="sm"
            variant="secondary"
            icon={<AddRoundedIcon />}
            onClick={openModal}
          >
            {t("newPreset")}
          </Button>
        </div>

        <div className="pomo-settings__presets">
          {BUILTINS.map((p) => (
            <button
              key={p.name}
              className={`pomo-settings__chip ${
                activeName === null && matches(p)
                  ? "pomo-settings__chip--active"
                  : ""
              }`}
              onClick={() =>
                applyPreset({
                  workMinutes: p.workMinutes,
                  breakMinutes: p.breakMinutes,
                  cycles: p.cycles,
                })
              }
            >
              {p.name}
            </button>
          ))}
          {presets.map((p) => (
            <span
              key={p.id}
              className={`pomo-settings__chip pomo-settings__chip--custom ${
                activeName === p.name && matches(p)
                  ? "pomo-settings__chip--active"
                  : ""
              }`}
            >
              <button
                className="pomo-settings__chip-label"
                onClick={() => applyPreset(p)}
                title={`${p.workMinutes} / ${p.breakMinutes} · ${p.cycles}`}
              >
                {p.name}
              </button>
              <button
                className="pomo-settings__chip-del"
                onClick={() => removePreset(p.id)}
                aria-label={tc("delete")}
              >
                <CloseRoundedIcon />
              </button>
            </span>
          ))}
        </div>

        <div className="pomo-settings__custom">
          <Field label={t("workMinutes")}>
            <TextInput
              type="number"
              min={1}
              max={180}
              value={config.workMinutes}
              disabled={running}
              onChange={(e) =>
                setConfig({ workMinutes: clamp(Number(e.target.value), 1, 180) })
              }
            />
          </Field>
          <Field label={t("breakMinutes")}>
            <TextInput
              type="number"
              min={1}
              max={60}
              value={config.breakMinutes}
              disabled={running}
              onChange={(e) =>
                setConfig({ breakMinutes: clamp(Number(e.target.value), 1, 60) })
              }
            />
          </Field>
          <Field label={t("cycles")}>
            <TextInput
              type="number"
              min={1}
              max={12}
              value={config.cycles}
              disabled={running}
              onChange={(e) =>
                setConfig({ cycles: clamp(Number(e.target.value), 1, 12) })
              }
            />
          </Field>
        </div>
      </section>

      <section className="pomo-settings__block">
        <h3 className="section-title">{t("linkTo")}</h3>
        <SegmentedControl<PomodoroLinkType>
          segments={[
            { value: "none", label: t("linkNone") },
            { value: "task", label: t("linkTask") },
            { value: "routine", label: t("linkRoutine") },
          ]}
          value={link.type}
          onChange={handleLinkType}
          size="sm"
          fullWidth
        />

        {link.type === "task" && (
          <Select
            value={link.id ?? ""}
            onChange={(v) => handleLinkItem(v)}
          >
            <option value="">{t("selectItem")}</option>
            {pendingTasks.map((task) => (
              <option key={task.id} value={task.id}>
                {task.title}
              </option>
            ))}
          </Select>
        )}

        {link.type === "routine" && (
          <Select
            value={link.id ?? ""}
            onChange={(v) => handleLinkItem(v)}
          >
            <option value="">{t("selectItem")}</option>
            {routines.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </Select>
        )}
      </section>

      {/* Modal: nuevo pomodoro con nombre */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={t("newPreset")}
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>
              {tc("cancel")}
            </Button>
            <Button variant="primary" onClick={createPreset}>
              {tc("create")}
            </Button>
          </>
        }
      >
        <div className="pomo-settings__modal">
          <Field label={t("presetName")}>
            <TextInput
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              placeholder={t("presetNamePlaceholder")}
              autoFocus
            />
          </Field>
          <div className="pomo-settings__custom">
            <Field label={t("workMinutes")}>
              <TextInput
                type="number"
                min={1}
                max={180}
                value={draftWork}
                onChange={(e) => setDraftWork(Number(e.target.value))}
              />
            </Field>
            <Field label={t("breakMinutes")}>
              <TextInput
                type="number"
                min={1}
                max={60}
                value={draftBreak}
                onChange={(e) => setDraftBreak(Number(e.target.value))}
              />
            </Field>
            <Field label={t("cycles")}>
              <TextInput
                type="number"
                min={1}
                max={12}
                value={draftCycles}
                onChange={(e) => setDraftCycles(Number(e.target.value))}
              />
            </Field>
          </div>
        </div>
      </Modal>
    </div>
  );
}
