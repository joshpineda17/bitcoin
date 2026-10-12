export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      auditoria: {
        Row: {
          accion: string
          actor_id: string | null
          creado_en: string
          detalle: Json
          entidad: string
          entidad_id: string
          id: number
        }
        Insert: {
          accion: string
          actor_id?: string | null
          creado_en?: string
          detalle?: Json
          entidad: string
          entidad_id: string
          id?: never
        }
        Update: {
          accion?: string
          actor_id?: string | null
          creado_en?: string
          detalle?: Json
          entidad?: string
          entidad_id?: string
          id?: never
        }
        Relationships: [
          {
            foreignKeyName: "auditoria_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      avisos: {
        Row: {
          creado_en: string
          id: string
          leido: boolean
          orden_id: string | null
          texto: string
          tipo: string
          usuario_id: string
        }
        Insert: {
          creado_en?: string
          id?: string
          leido?: boolean
          orden_id?: string | null
          texto: string
          tipo: string
          usuario_id: string
        }
        Update: {
          creado_en?: string
          id?: string
          leido?: boolean
          orden_id?: string | null
          texto?: string
          tipo?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "avisos_orden_id_fkey"
            columns: ["orden_id"]
            isOneToOne: false
            referencedRelation: "ordenes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "avisos_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      categorias: {
        Row: {
          id: number
          nombre: string
          orden: number
        }
        Insert: {
          id?: never
          nombre: string
          orden?: number
        }
        Update: {
          id?: never
          nombre?: string
          orden?: number
        }
        Relationships: []
      }
      cobros: {
        Row: {
          bolt11: string | null
          destino: string | null
          estado: Database["public"]["Enums"]["estado_cobro"]
          expira_en: string
          id: string
          orden_id: string
          pagado_en: string | null
          proveedor: Database["public"]["Enums"]["tipo_proveedor"]
          referencia_externa: string | null
          verificar_url: string | null
        }
        Insert: {
          bolt11?: string | null
          destino?: string | null
          estado?: Database["public"]["Enums"]["estado_cobro"]
          expira_en: string
          id?: string
          orden_id: string
          pagado_en?: string | null
          proveedor: Database["public"]["Enums"]["tipo_proveedor"]
          referencia_externa?: string | null
          verificar_url?: string | null
        }
        Update: {
          bolt11?: string | null
          destino?: string | null
          estado?: Database["public"]["Enums"]["estado_cobro"]
          expira_en?: string
          id?: string
          orden_id?: string
          pagado_en?: string | null
          proveedor?: Database["public"]["Enums"]["tipo_proveedor"]
          referencia_externa?: string | null
          verificar_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cobros_orden_id_fkey"
            columns: ["orden_id"]
            isOneToOne: true
            referencedRelation: "ordenes"
            referencedColumns: ["id"]
          },
        ]
      }
      disputas: {
        Row: {
          creada_en: string
          estado: Database["public"]["Enums"]["estado_disputa"]
          evidencia: string
          id: string
          motivo: string
          nota_resolucion: string
          orden_id: string
          reembolso_confirmado_en: string | null
          reembolso_marcado_en: string | null
          resuelta_en: string | null
          resuelta_por: string | null
          resultado: Database["public"]["Enums"]["resultado_disputa"] | null
        }
        Insert: {
          creada_en?: string
          estado?: Database["public"]["Enums"]["estado_disputa"]
          evidencia?: string
          id?: string
          motivo: string
          nota_resolucion?: string
          orden_id: string
          reembolso_confirmado_en?: string | null
          reembolso_marcado_en?: string | null
          resuelta_en?: string | null
          resuelta_por?: string | null
          resultado?: Database["public"]["Enums"]["resultado_disputa"] | null
        }
        Update: {
          creada_en?: string
          estado?: Database["public"]["Enums"]["estado_disputa"]
          evidencia?: string
          id?: string
          motivo?: string
          nota_resolucion?: string
          orden_id?: string
          reembolso_confirmado_en?: string | null
          reembolso_marcado_en?: string | null
          resuelta_en?: string | null
          resuelta_por?: string | null
          resultado?: Database["public"]["Enums"]["resultado_disputa"] | null
        }
        Relationships: [
          {
            foreignKeyName: "disputas_orden_id_fkey"
            columns: ["orden_id"]
            isOneToOne: true
            referencedRelation: "ordenes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disputas_resuelta_por_fkey"
            columns: ["resuelta_por"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      lineas_orden: {
        Row: {
          cantidad: number
          id: string
          nombre: string
          orden_id: string
          precio_usd_centavos: number
          producto_id: string
          unidad: string
        }
        Insert: {
          cantidad: number
          id?: string
          nombre: string
          orden_id: string
          precio_usd_centavos: number
          producto_id: string
          unidad: string
        }
        Update: {
          cantidad?: number
          id?: string
          nombre?: string
          orden_id?: string
          precio_usd_centavos?: number
          producto_id?: string
          unidad?: string
        }
        Relationships: [
          {
            foreignKeyName: "lineas_orden_orden_id_fkey"
            columns: ["orden_id"]
            isOneToOne: false
            referencedRelation: "ordenes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lineas_orden_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos"
            referencedColumns: ["id"]
          },
        ]
      }
      mensajes: {
        Row: {
          autor_id: string
          creado_en: string
          id: string
          orden_id: string
          texto: string
        }
        Insert: {
          autor_id: string
          creado_en?: string
          id?: string
          orden_id: string
          texto: string
        }
        Update: {
          autor_id?: string
          creado_en?: string
          id?: string
          orden_id?: string
          texto?: string
        }
        Relationships: [
          {
            foreignKeyName: "mensajes_autor_id_fkey"
            columns: ["autor_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mensajes_orden_id_fkey"
            columns: ["orden_id"]
            isOneToOne: false
            referencedRelation: "ordenes"
            referencedColumns: ["id"]
          },
        ]
      }
      negocios: {
        Row: {
          abierto: boolean
          creado_en: string
          credencial_pago_cifrada: string | null
          descripcion: string
          estado: Database["public"]["Enums"]["estado_negocio"]
          id: string
          lightning_address: string | null
          nombre: string
          tipo_proveedor_pago: Database["public"]["Enums"]["tipo_proveedor"]
          ubicacion: string
          usuario_id: string
        }
        Insert: {
          abierto?: boolean
          creado_en?: string
          credencial_pago_cifrada?: string | null
          descripcion?: string
          estado?: Database["public"]["Enums"]["estado_negocio"]
          id?: string
          lightning_address?: string | null
          nombre: string
          tipo_proveedor_pago?: Database["public"]["Enums"]["tipo_proveedor"]
          ubicacion?: string
          usuario_id: string
        }
        Update: {
          abierto?: boolean
          creado_en?: string
          credencial_pago_cifrada?: string | null
          descripcion?: string
          estado?: Database["public"]["Enums"]["estado_negocio"]
          id?: string
          lightning_address?: string | null
          nombre?: string
          tipo_proveedor_pago?: Database["public"]["Enums"]["tipo_proveedor"]
          ubicacion?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "negocios_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: true
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      ordenes: {
        Row: {
          cerrada_en: string | null
          clave_idempotencia: string
          codigo_entrega: string | null
          comision_teorica_sats: number
          comprador_id: string
          cotizacion_usd_btc: number
          creada_en: string
          disputada_en: string | null
          entregada_en: string | null
          estado: Database["public"]["Enums"]["estado_orden"]
          expirada_en: string | null
          id: string
          lista_en: string | null
          modo_entrega: Database["public"]["Enums"]["modo_entrega"]
          negocio_id: string
          numero: number
          pagada_en: string | null
          resuelta_en: string | null
          total_sats: number
          total_usd_centavos: number
        }
        Insert: {
          cerrada_en?: string | null
          clave_idempotencia: string
          codigo_entrega?: string | null
          comision_teorica_sats?: number
          comprador_id: string
          cotizacion_usd_btc: number
          creada_en?: string
          disputada_en?: string | null
          entregada_en?: string | null
          estado?: Database["public"]["Enums"]["estado_orden"]
          expirada_en?: string | null
          id?: string
          lista_en?: string | null
          modo_entrega: Database["public"]["Enums"]["modo_entrega"]
          negocio_id: string
          numero?: never
          pagada_en?: string | null
          resuelta_en?: string | null
          total_sats: number
          total_usd_centavos: number
        }
        Update: {
          cerrada_en?: string | null
          clave_idempotencia?: string
          codigo_entrega?: string | null
          comision_teorica_sats?: number
          comprador_id?: string
          cotizacion_usd_btc?: number
          creada_en?: string
          disputada_en?: string | null
          entregada_en?: string | null
          estado?: Database["public"]["Enums"]["estado_orden"]
          expirada_en?: string | null
          id?: string
          lista_en?: string | null
          modo_entrega?: Database["public"]["Enums"]["modo_entrega"]
          negocio_id?: string
          numero?: never
          pagada_en?: string | null
          resuelta_en?: string | null
          total_sats?: number
          total_usd_centavos?: number
        }
        Relationships: [
          {
            foreignKeyName: "ordenes_comprador_id_fkey"
            columns: ["comprador_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordenes_negocio_id_fkey"
            columns: ["negocio_id"]
            isOneToOne: false
            referencedRelation: "negocios"
            referencedColumns: ["id"]
          },
        ]
      }
      productos: {
        Row: {
          activo: boolean
          categoria_id: number
          creado_en: string
          descripcion: string
          fotos: string[]
          id: string
          negocio_id: string
          nombre: string
          precio_usd_centavos: number
          stock: number
          unidad: string
        }
        Insert: {
          activo?: boolean
          categoria_id: number
          creado_en?: string
          descripcion?: string
          fotos?: string[]
          id?: string
          negocio_id: string
          nombre: string
          precio_usd_centavos: number
          stock?: number
          unidad: string
        }
        Update: {
          activo?: boolean
          categoria_id?: number
          creado_en?: string
          descripcion?: string
          fotos?: string[]
          id?: string
          negocio_id?: string
          nombre?: string
          precio_usd_centavos?: number
          stock?: number
          unidad?: string
        }
        Relationships: [
          {
            foreignKeyName: "productos_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "productos_negocio_id_fkey"
            columns: ["negocio_id"]
            isOneToOne: false
            referencedRelation: "negocios"
            referencedColumns: ["id"]
          },
        ]
      }
      resenas: {
        Row: {
          comentario: string
          creada_en: string
          id: string
          negocio_id: string
          orden_id: string
          puntuacion: number
        }
        Insert: {
          comentario?: string
          creada_en?: string
          id?: string
          negocio_id: string
          orden_id: string
          puntuacion: number
        }
        Update: {
          comentario?: string
          creada_en?: string
          id?: string
          negocio_id?: string
          orden_id?: string
          puntuacion?: number
        }
        Relationships: [
          {
            foreignKeyName: "resenas_negocio_id_fkey"
            columns: ["negocio_id"]
            isOneToOne: false
            referencedRelation: "negocios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resenas_orden_id_fkey"
            columns: ["orden_id"]
            isOneToOne: true
            referencedRelation: "ordenes"
            referencedColumns: ["id"]
          },
        ]
      }
      usuarios: {
        Row: {
          creado_en: string
          es_admin: boolean
          id: string
          nombre: string
          telefono: string
        }
        Insert: {
          creado_en?: string
          es_admin?: boolean
          id: string
          nombre?: string
          telefono: string
        }
        Update: {
          creado_en?: string
          es_admin?: boolean
          id?: string
          nombre?: string
          telefono?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      es_admin: { Args: never; Returns: boolean }
      mi_negocio_id: { Args: never; Returns: string }
      puede_ver_orden: { Args: { p_orden_id: string }; Returns: boolean }
    }
    Enums: {
      estado_cobro: "pendiente" | "pagado" | "expirado"
      estado_disputa: "abierta" | "resuelta"
      estado_negocio: "pendiente" | "aprobado" | "suspendido"
      estado_orden:
        | "creada"
        | "esperando_pago"
        | "pagada"
        | "lista"
        | "entregada"
        | "cerrada"
        | "expirada"
        | "disputada"
        | "resuelta"
      modo_entrega: "recogida" | "entrega_vendedor"
      resultado_disputa:
        | "reembolso_total"
        | "reembolso_parcial"
        | "sin_reembolso"
      tipo_proveedor: "manual" | "falso" | "nwc" | "blink"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      estado_cobro: ["pendiente", "pagado", "expirado"],
      estado_disputa: ["abierta", "resuelta"],
      estado_negocio: ["pendiente", "aprobado", "suspendido"],
      estado_orden: [
        "creada",
        "esperando_pago",
        "pagada",
        "lista",
        "entregada",
        "cerrada",
        "expirada",
        "disputada",
        "resuelta",
      ],
      modo_entrega: ["recogida", "entrega_vendedor"],
      resultado_disputa: [
        "reembolso_total",
        "reembolso_parcial",
        "sin_reembolso",
      ],
      tipo_proveedor: ["manual", "falso", "nwc", "blink"],
    },
  },
} as const

