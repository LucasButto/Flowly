import type { CSSProperties } from "react";
import type { SvgIconComponent } from "@mui/icons-material";

// Personal / celebración
import CardGiftcardRoundedIcon from "@mui/icons-material/CardGiftcardRounded";
import CakeRoundedIcon from "@mui/icons-material/CakeRounded";
import CelebrationRoundedIcon from "@mui/icons-material/CelebrationRounded";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import FavoriteRoundedIcon from "@mui/icons-material/FavoriteRounded";
import FlagRoundedIcon from "@mui/icons-material/FlagRounded";
// Trabajo / estudio
import WorkRoundedIcon from "@mui/icons-material/WorkRounded";
import SchoolRoundedIcon from "@mui/icons-material/SchoolRounded";
import CodeRoundedIcon from "@mui/icons-material/CodeRounded";
import LightbulbRoundedIcon from "@mui/icons-material/LightbulbRounded";
import EventRoundedIcon from "@mui/icons-material/EventRounded";
import AlarmRoundedIcon from "@mui/icons-material/AlarmRounded";
// Salud / deporte
import FitnessCenterRoundedIcon from "@mui/icons-material/FitnessCenterRounded";
import DirectionsRunRoundedIcon from "@mui/icons-material/DirectionsRunRounded";
import SportsSoccerRoundedIcon from "@mui/icons-material/SportsSoccerRounded";
import SpaRoundedIcon from "@mui/icons-material/SpaRounded";
import MedicalServicesRoundedIcon from "@mui/icons-material/MedicalServicesRounded";
import MedicationRoundedIcon from "@mui/icons-material/MedicationRounded";
import BedtimeRoundedIcon from "@mui/icons-material/BedtimeRounded";
import WbSunnyRoundedIcon from "@mui/icons-material/WbSunnyRounded";
// Comida / compras
import RestaurantRoundedIcon from "@mui/icons-material/RestaurantRounded";
import LocalCafeRoundedIcon from "@mui/icons-material/LocalCafeRounded";
import ShoppingCartRoundedIcon from "@mui/icons-material/ShoppingCartRounded";
import PaymentsRoundedIcon from "@mui/icons-material/PaymentsRounded";
// Viajes / transporte
import FlightRoundedIcon from "@mui/icons-material/FlightRounded";
import DirectionsCarRoundedIcon from "@mui/icons-material/DirectionsCarRounded";
import BeachAccessRoundedIcon from "@mui/icons-material/BeachAccessRounded";
import PetsRoundedIcon from "@mui/icons-material/PetsRounded";
// Ocio / hobbies
import MusicNoteRoundedIcon from "@mui/icons-material/MusicNoteRounded";
import MovieRoundedIcon from "@mui/icons-material/MovieRounded";
import SportsEsportsRoundedIcon from "@mui/icons-material/SportsEsportsRounded";
import MenuBookRoundedIcon from "@mui/icons-material/MenuBookRounded";
import BrushRoundedIcon from "@mui/icons-material/BrushRounded";
import PhotoCameraRoundedIcon from "@mui/icons-material/PhotoCameraRounded";
// Social / comunicación
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import CallRoundedIcon from "@mui/icons-material/CallRounded";
import EmailRoundedIcon from "@mui/icons-material/EmailRounded";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";
import BuildRoundedIcon from "@mui/icons-material/BuildRounded";
// Hogar / día a día
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import WaterDropRoundedIcon from "@mui/icons-material/WaterDropRounded";
import BedRoundedIcon from "@mui/icons-material/BedRounded";
import CleaningServicesRoundedIcon from "@mui/icons-material/CleaningServicesRounded";
import LocalFloristRoundedIcon from "@mui/icons-material/LocalFloristRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";

/**
 * Catálogo de iconos disponibles para rutinas, listas, eventos y notas.
 * La clave (string) es lo que se persiste en Firestore; nunca renombrar una
 * clave existente (rompería los iconos ya guardados). "" = sin icono.
 */
export const ICON_MAP: Record<string, SvgIconComponent> = {
  gift: CardGiftcardRoundedIcon,
  cake: CakeRoundedIcon,
  celebration: CelebrationRoundedIcon,
  star: StarRoundedIcon,
  heart: FavoriteRoundedIcon,
  flag: FlagRoundedIcon,
  work: WorkRoundedIcon,
  school: SchoolRoundedIcon,
  code: CodeRoundedIcon,
  idea: LightbulbRoundedIcon,
  event: EventRoundedIcon,
  alarm: AlarmRoundedIcon,
  fitness: FitnessCenterRoundedIcon,
  run: DirectionsRunRoundedIcon,
  sports: SportsSoccerRoundedIcon,
  wellness: SpaRoundedIcon,
  health: MedicalServicesRoundedIcon,
  medication: MedicationRoundedIcon,
  moon: BedtimeRoundedIcon,
  sun: WbSunnyRoundedIcon,
  food: RestaurantRoundedIcon,
  coffee: LocalCafeRoundedIcon,
  shopping: ShoppingCartRoundedIcon,
  money: PaymentsRoundedIcon,
  travel: FlightRoundedIcon,
  car: DirectionsCarRoundedIcon,
  beach: BeachAccessRoundedIcon,
  pets: PetsRoundedIcon,
  music: MusicNoteRoundedIcon,
  movie: MovieRoundedIcon,
  games: SportsEsportsRoundedIcon,
  book: MenuBookRoundedIcon,
  art: BrushRoundedIcon,
  photo: PhotoCameraRoundedIcon,
  people: GroupsRoundedIcon,
  call: CallRoundedIcon,
  email: EmailRoundedIcon,
  settings: SettingsRoundedIcon,
  build: BuildRoundedIcon,
  home: HomeRoundedIcon,
  water: WaterDropRoundedIcon,
  sleep: BedRoundedIcon,
  cleaning: CleaningServicesRoundedIcon,
  nature: LocalFloristRoundedIcon,
  task: CheckCircleRoundedIcon,
};

/** Orden en el que se muestran los iconos en el selector. */
export const PRESET_ICONS = Object.keys(ICON_MAP);

interface FlowIconProps {
  /** Clave del icono. "" / undefined / desconocida → no renderiza nada. */
  name?: string | null;
  className?: string;
  style?: CSSProperties;
}

/** Renderiza el icono guardado, o `null` si el elemento no tiene icono. */
export default function FlowIcon({ name, className, style }: FlowIconProps) {
  if (!name) return null;
  const Icon = ICON_MAP[name];
  if (!Icon) return null;
  return <Icon className={className} style={style} />;
}
