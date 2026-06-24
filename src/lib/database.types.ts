export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      affaires: {
        Row: {
          avancement: number
          chantier: string | null
          client_id: string | null
          conducteur: string | null
          conducteur_tel: string | null
          created_at: string
          created_by: string | null
          date_acceptation: string | null
          date_livraison: string | null
          devis_id: string | null
          element: string | null
          id: string
          mode: Database["public"]["Enums"]["mode_chiffrage"]
          numero: string
          objet: string | null
          statut: string | null
          total_ht: number
          updated_at: string | null
        }
        Insert: {
          avancement?: number
          chantier?: string | null
          client_id?: string | null
          conducteur?: string | null
          conducteur_tel?: string | null
          created_at?: string
          created_by?: string | null
          date_acceptation?: string | null
          date_livraison?: string | null
          devis_id?: string | null
          element?: string | null
          id?: string
          mode: Database["public"]["Enums"]["mode_chiffrage"]
          numero: string
          objet?: string | null
          statut?: string | null
          total_ht?: number
          updated_at?: string | null
        }
        Update: {
          avancement?: number
          chantier?: string | null
          client_id?: string | null
          conducteur?: string | null
          conducteur_tel?: string | null
          created_at?: string
          created_by?: string | null
          date_acceptation?: string | null
          date_livraison?: string | null
          devis_id?: string | null
          element?: string | null
          id?: string
          mode?: Database["public"]["Enums"]["mode_chiffrage"]
          numero?: string
          objet?: string | null
          statut?: string | null
          total_ht?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "affaires_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affaires_devis_id_fkey"
            columns: ["devis_id"]
            isOneToOne: false
            referencedRelation: "devis"
            referencedColumns: ["id"]
          },
        ]
      }
      catalogue_matieres: {
        Row: {
          cat: string
          chute: number
          code: string
          code_unite: number | null
          epaisseur: number | null
          famille: string | null
          id: string
          prefixe: string | null
          prix: number
          ref: string | null
          unite: string | null
        }
        Insert: {
          cat: string
          chute?: number
          code: string
          code_unite?: number | null
          epaisseur?: number | null
          famille?: string | null
          id?: string
          prefixe?: string | null
          prix?: number
          ref?: string | null
          unite?: string | null
        }
        Update: {
          cat?: string
          chute?: number
          code?: string
          code_unite?: number | null
          epaisseur?: number | null
          famille?: string | null
          id?: string
          prefixe?: string | null
          prix?: number
          ref?: string | null
          unite?: string | null
        }
        Relationships: []
      }
      categories_heures: {
        Row: {
          code: string
          label: string
          taux: number
        }
        Insert: {
          code: string
          label: string
          taux: number
        }
        Update: {
          code?: string
          label?: string
          taux?: number
        }
        Relationships: []
      }
      chutes: {
        Row: {
          affaire_consommation: string | null
          affaire_origine: string | null
          cat: string | null
          created_at: string
          designation: string | null
          epaisseur: number | null
          id: string
          largeur: number | null
          longueur: number | null
          matiere_code: string | null
          operateur_id: string | null
          prix_unit: number | null
          statut: Database["public"]["Enums"]["chute_statut"]
          updated_at: string | null
        }
        Insert: {
          affaire_consommation?: string | null
          affaire_origine?: string | null
          cat?: string | null
          created_at?: string
          designation?: string | null
          epaisseur?: number | null
          id?: string
          largeur?: number | null
          longueur?: number | null
          matiere_code?: string | null
          operateur_id?: string | null
          prix_unit?: number | null
          statut?: Database["public"]["Enums"]["chute_statut"]
          updated_at?: string | null
        }
        Update: {
          affaire_consommation?: string | null
          affaire_origine?: string | null
          cat?: string | null
          created_at?: string
          designation?: string | null
          epaisseur?: number | null
          id?: string
          largeur?: number | null
          longueur?: number | null
          matiere_code?: string | null
          operateur_id?: string | null
          prix_unit?: number | null
          statut?: Database["public"]["Enums"]["chute_statut"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chutes_affaire_consommation_fkey"
            columns: ["affaire_consommation"]
            isOneToOne: false
            referencedRelation: "affaires"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chutes_affaire_origine_fkey"
            columns: ["affaire_origine"]
            isOneToOne: false
            referencedRelation: "affaires"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          contact: string | null
          created_at: string
          email: string | null
          id: string
          nom: string
          tel: string | null
          type: string | null
          updated_at: string | null
          ville: string | null
        }
        Insert: {
          contact?: string | null
          created_at?: string
          email?: string | null
          id?: string
          nom: string
          tel?: string | null
          type?: string | null
          updated_at?: string | null
          ville?: string | null
        }
        Update: {
          contact?: string | null
          created_at?: string
          email?: string | null
          id?: string
          nom?: string
          tel?: string | null
          type?: string | null
          updated_at?: string | null
          ville?: string | null
        }
        Relationships: []
      }
      colis: {
        Row: {
          affaire_id: string
          date: string
          hauteur: number | null
          id: string
          largeur: number | null
          longueur: number | null
          numero: number | null
          poids: number | null
        }
        Insert: {
          affaire_id: string
          date?: string
          hauteur?: number | null
          id?: string
          largeur?: number | null
          longueur?: number | null
          numero?: number | null
          poids?: number | null
        }
        Update: {
          affaire_id?: string
          date?: string
          hauteur?: number | null
          id?: string
          largeur?: number | null
          longueur?: number | null
          numero?: number | null
          poids?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "colis_affaire_id_fkey"
            columns: ["affaire_id"]
            isOneToOne: false
            referencedRelation: "affaires"
            referencedColumns: ["id"]
          },
        ]
      }
      devis: {
        Row: {
          chantier: string | null
          client_id: string | null
          created_at: string
          created_by: string | null
          date_creation: string
          date_validite: string | null
          frais_transport: number
          id: string
          mode: Database["public"]["Enums"]["mode_chiffrage"]
          numero: string
          numero_racine: string
          objet: string | null
          parent_devis_id: string | null
          statut: Database["public"]["Enums"]["devis_statut"]
          total_ht: number
          updated_at: string | null
          version: string
        }
        Insert: {
          chantier?: string | null
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          date_creation?: string
          date_validite?: string | null
          frais_transport?: number
          id?: string
          mode: Database["public"]["Enums"]["mode_chiffrage"]
          numero: string
          numero_racine: string
          objet?: string | null
          parent_devis_id?: string | null
          statut?: Database["public"]["Enums"]["devis_statut"]
          total_ht?: number
          updated_at?: string | null
          version?: string
        }
        Update: {
          chantier?: string | null
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          date_creation?: string
          date_validite?: string | null
          frais_transport?: number
          id?: string
          mode?: Database["public"]["Enums"]["mode_chiffrage"]
          numero?: string
          numero_racine?: string
          objet?: string | null
          parent_devis_id?: string | null
          statut?: Database["public"]["Enums"]["devis_statut"]
          total_ht?: number
          updated_at?: string | null
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "devis_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "devis_parent_devis_id_fkey"
            columns: ["parent_devis_id"]
            isOneToOne: false
            referencedRelation: "devis"
            referencedColumns: ["id"]
          },
        ]
      }
      etapes_affaire: {
        Row: {
          affaire_id: string
          date: string | null
          etape: Database["public"]["Enums"]["etape_cle"]
          fait: boolean
          id: string
        }
        Insert: {
          affaire_id: string
          date?: string | null
          etape: Database["public"]["Enums"]["etape_cle"]
          fait?: boolean
          id?: string
        }
        Update: {
          affaire_id?: string
          date?: string | null
          etape?: Database["public"]["Enums"]["etape_cle"]
          fait?: boolean
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "etapes_affaire_affaire_id_fkey"
            columns: ["affaire_id"]
            isOneToOne: false
            referencedRelation: "affaires"
            referencedColumns: ["id"]
          },
        ]
      }
      factures: {
        Row: {
          affaire_id: string | null
          client_id: string | null
          created_at: string
          created_by: string | null
          date_echeance: string | null
          date_emission: string | null
          date_paiement: string | null
          id: string
          montant_ht: number
          montant_ttc: number | null
          numero: string
          statut: Database["public"]["Enums"]["facture_statut"]
          updated_at: string | null
        }
        Insert: {
          affaire_id?: string | null
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          date_echeance?: string | null
          date_emission?: string | null
          date_paiement?: string | null
          id?: string
          montant_ht?: number
          montant_ttc?: number | null
          numero: string
          statut?: Database["public"]["Enums"]["facture_statut"]
          updated_at?: string | null
        }
        Update: {
          affaire_id?: string | null
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          date_echeance?: string | null
          date_emission?: string | null
          date_paiement?: string | null
          id?: string
          montant_ht?: number
          montant_ttc?: number | null
          numero?: string
          statut?: Database["public"]["Enums"]["facture_statut"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "factures_affaire_id_fkey"
            columns: ["affaire_id"]
            isOneToOne: false
            referencedRelation: "affaires"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "factures_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      formulaires_valides: {
        Row: {
          affaire_id: string
          date: string
          valide: boolean
          valide_par: string | null
        }
        Insert: {
          affaire_id: string
          date?: string
          valide?: boolean
          valide_par?: string | null
        }
        Update: {
          affaire_id?: string
          date?: string
          valide?: boolean
          valide_par?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "formulaires_valides_affaire_id_fkey"
            columns: ["affaire_id"]
            isOneToOne: true
            referencedRelation: "affaires"
            referencedColumns: ["id"]
          },
        ]
      }
      heures_flashees: {
        Row: {
          affaire_id: string
          code_tache: string | null
          created_at: string
          date: string
          duree_min: number
          id: string
          operateur_id: string | null
          operateur_nom: string | null
        }
        Insert: {
          affaire_id: string
          code_tache?: string | null
          created_at?: string
          date?: string
          duree_min: number
          id?: string
          operateur_id?: string | null
          operateur_nom?: string | null
        }
        Update: {
          affaire_id?: string
          code_tache?: string | null
          created_at?: string
          date?: string
          duree_min?: number
          id?: string
          operateur_id?: string | null
          operateur_nom?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "heures_flashees_affaire_id_fkey"
            columns: ["affaire_id"]
            isOneToOne: false
            referencedRelation: "affaires"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "heures_flashees_code_tache_fkey"
            columns: ["code_tache"]
            isOneToOne: false
            referencedRelation: "taches_codes"
            referencedColumns: ["code"]
          },
        ]
      }
      machines: {
        Row: {
          id: string
          label: string
          mo_code: string | null
        }
        Insert: {
          id: string
          label: string
          mo_code?: string | null
        }
        Update: {
          id?: string
          label?: string
          mo_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "machines_mo_code_fkey"
            columns: ["mo_code"]
            isOneToOne: false
            referencedRelation: "taux_horaires_mo"
            referencedColumns: ["code"]
          },
        ]
      }
      parametres: {
        Row: {
          cle: string
          description: string | null
          valeur: number
        }
        Insert: {
          cle: string
          description?: string | null
          valeur: number
        }
        Update: {
          cle?: string
          description?: string | null
          valeur?: number
        }
        Relationships: []
      }
      photos: {
        Row: {
          affaire_id: string | null
          created_by: string | null
          date: string
          etape: string | null
          id: string
          legende: string | null
          url: string | null
        }
        Insert: {
          affaire_id?: string | null
          created_by?: string | null
          date?: string
          etape?: string | null
          id?: string
          legende?: string | null
          url?: string | null
        }
        Update: {
          affaire_id?: string | null
          created_by?: string | null
          date?: string
          etape?: string | null
          id?: string
          legende?: string | null
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "photos_affaire_id_fkey"
            columns: ["affaire_id"]
            isOneToOne: false
            referencedRelation: "affaires"
            referencedColumns: ["id"]
          },
        ]
      }
      pieces: {
        Row: {
          affaire_id: string
          created_at: string
          created_by: string | null
          designation: string | null
          dimensions: Json | null
          fait: boolean
          fait_date: string | null
          fait_par: string | null
          geometrie: string | null
          id: string
          matiere_code: string | null
          nb: number
          pourcent_chute: number
          prix: number | null
          ref1: string | null
          ref2: string | null
          section_finie: string | null
          type: string
          unite: string | null
          updated_at: string | null
        }
        Insert: {
          affaire_id: string
          created_at?: string
          created_by?: string | null
          designation?: string | null
          dimensions?: Json | null
          fait?: boolean
          fait_date?: string | null
          fait_par?: string | null
          geometrie?: string | null
          id?: string
          matiere_code?: string | null
          nb?: number
          pourcent_chute?: number
          prix?: number | null
          ref1?: string | null
          ref2?: string | null
          section_finie?: string | null
          type: string
          unite?: string | null
          updated_at?: string | null
        }
        Update: {
          affaire_id?: string
          created_at?: string
          created_by?: string | null
          designation?: string | null
          dimensions?: Json | null
          fait?: boolean
          fait_date?: string | null
          fait_par?: string | null
          geometrie?: string | null
          id?: string
          matiere_code?: string | null
          nb?: number
          pourcent_chute?: number
          prix?: number | null
          ref1?: string | null
          ref2?: string | null
          section_finie?: string | null
          type?: string
          unite?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pieces_affaire_id_fkey"
            columns: ["affaire_id"]
            isOneToOne: false
            referencedRelation: "affaires"
            referencedColumns: ["id"]
          },
        ]
      }
      profils: {
        Row: {
          actif: boolean
          created_at: string
          email: string | null
          flash: boolean
          id: string
          initiales: string | null
          nom: string
          poste: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string | null
        }
        Insert: {
          actif?: boolean
          created_at?: string
          email?: string | null
          flash?: boolean
          id: string
          initiales?: string | null
          nom: string
          poste?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
        }
        Update: {
          actif?: boolean
          created_at?: string
          email?: string | null
          flash?: boolean
          id?: string
          initiales?: string | null
          nom?: string
          poste?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
        }
        Relationships: []
      }
      taches_codes: {
        Row: {
          categorie_heures: string | null
          code: string
          facturable: boolean
          groupe: string
          label: string
        }
        Insert: {
          categorie_heures?: string | null
          code: string
          facturable?: boolean
          groupe: string
          label: string
        }
        Update: {
          categorie_heures?: string | null
          code?: string
          facturable?: boolean
          groupe?: string
          label?: string
        }
        Relationships: [
          {
            foreignKeyName: "taches_codes_categorie_heures_fkey"
            columns: ["categorie_heures"]
            isOneToOne: false
            referencedRelation: "categories_heures"
            referencedColumns: ["code"]
          },
        ]
      }
      taux_horaires_mo: {
        Row: {
          code: string
          des: string
          op: number
          taux: number
        }
        Insert: {
          code: string
          des: string
          op?: number
          taux: number
        }
        Update: {
          code?: string
          des?: string
          op?: number
          taux?: number
        }
        Relationships: []
      }
      types_debit: {
        Row: {
          champs: Json
          description: string | null
          id: string
          label: string
        }
        Insert: {
          champs: Json
          description?: string | null
          id: string
          label: string
        }
        Update: {
          champs?: Json
          description?: string | null
          id?: string
          label?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_user_role: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
      is_admin: { Args: never; Returns: boolean }
      is_staff: { Args: never; Returns: boolean }
    }
    Enums: {
      chute_statut: "disponible" | "reutilisee_partiel" | "consommee" | "rebut"
      devis_statut: "brouillon" | "envoye" | "accepte" | "refuse"
      etape_cle:
        | "devis_accepte"
        | "saisie_pieces"
        | "pr_valide"
        | "dessin_be"
        | "debit"
        | "montage"
        | "finition"
        | "colisage"
        | "livraison"
        | "facturation"
        | "paiement"
      facture_statut: "brouillon" | "envoyee" | "payee" | "retard"
      mode_chiffrage:
        | "coffrage"
        | "prefa"
        | "mannequin"
        | "sateba"
        | "vente"
        | "usinage"
        | "decor"
        | "autre"
      user_role:
        | "admin"
        | "direction"
        | "compta"
        | "chef_prod"
        | "bureau_etudes"
        | "operateur"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      chute_statut: ["disponible", "reutilisee_partiel", "consommee", "rebut"],
      devis_statut: ["brouillon", "envoye", "accepte", "refuse"],
      etape_cle: [
        "devis_accepte",
        "saisie_pieces",
        "pr_valide",
        "dessin_be",
        "debit",
        "montage",
        "finition",
        "colisage",
        "livraison",
        "facturation",
        "paiement",
      ],
      facture_statut: ["brouillon", "envoyee", "payee", "retard"],
      mode_chiffrage: [
        "coffrage",
        "prefa",
        "mannequin",
        "sateba",
        "vente",
        "usinage",
        "decor",
        "autre",
      ],
      user_role: [
        "admin",
        "direction",
        "compta",
        "chef_prod",
        "bureau_etudes",
        "operateur",
      ],
    },
  },
} as const
