

/**
 * DATABASE SCHEMA CONFIGURATION
 * Converted to pure JavaScript. 
 * This object mimics the structure of your original 'Database' type 
 * so your app logic remains consistent.
 */

// export const Database = {
//   __InternalSupabase: {
//     PostgrestVersion: "14.4"
//   },
//   public: {
//     Tables: {
//       complaint_history: {
//         name: "complaint_history",
//         columns: ["complaint_id", "created_at", "id", "note", "status"],
//         relationships: [
//           {
//             foreignKeyName: "complaint_history_complaint_id_fkey",
//             columns: ["complaint_id"],
//             isOneToOne: false,
//             referencedRelation: "complaints",
//             referencedColumns: ["id"]
//           }
//         ]
//       },
//       complaints: {
//         name: "complaints",
//         columns: [
//           "category", "citizen_email", "citizen_name", "complaint_number",
//           "created_at", "description", "id", "image_url", "language",
//           "location", "phone", "priority", "sentiment", "status",
//           "updated_at", "user_id", "ward"
//         ],
//         relationships: []
//       },
//       profiles: {
//         name: "profiles",
//         columns: ["avatar_url", "created_at", "id", "name", "phone", "role", "updated_at", "user_id"],
//         relationships: []
//       }
//     },
//     Views: {},
//     Functions: {
//       get_user_role: { name: "get_user_role", args: ["_user_id"] },
//       is_government: { name: "is_government", args: ["_user_id"] },
//       nextval: { name: "nextval", args: ["seq_name"] }
//     },
//     Enums: {
//       app_role: {
//         CITIZEN: "citizen",
//         GOVERNMENT: "government"
//       }
//     }
//   }
// };
// 1. Enums: Provides a single source of truth for application roles
export const Enums = {
  app_role: {
    CITIZEN: "citizen",
    GOVERNMENT: "government",
  }
};

// 2. Database Functions (RPCs): Mapping arguments and return types for reference
export const DatabaseFunctions = {
  get_user_role: {
    name: "get_user_role",
    definition: (_user_id) => ({ _user_id }),
    returns: "app_role"
  },
  is_government: {
    name: "is_government",
    definition: (_user_id) => ({ _user_id }),
    returns: "boolean"
  },
  nextval: {
    name: "nextval",
    definition: (seq_name) => ({ seq_name }),
    returns: "number"
  }
};

// 3. Tables & Schema Blueprint: Preserving metadata and relationships
export const Tables = {
  complaint_history: {
    name: "complaint_history",
    columns: ["complaint_id", "created_at", "id", "note", "status"],
    relationships: [
      {
        foreignKey: "complaint_history_complaint_id_fkey",
        columns: ["complaint_id"],
        referencedRelation: "complaints",
        referencedColumns: ["id"],
      }
    ]
  },
  complaints: {
    name: "complaints",
    columns: [
      "id", "category", "citizen_email", "citizen_name", "complaint_number",
      "created_at", "description", "image_url", "language", "location", 
      "phone", "priority", "sentiment", "status", "updated_at", "user_id", "ward"
    ],
    relationships: []
  },
  profiles: {
    name: "profiles",
    columns: ["id", "user_id", "role", "name", "phone", "avatar_url", "created_at", "updated_at"],
    relationships: []
  }
};

// 4. Combined Constants: Single declaration for UI and validation logic
export const Constants = {
  public: {
    Enums: {
      app_role: [Enums.app_role.CITIZEN, Enums.app_role.GOVERNMENT],
    },
    Tables: Tables
  },
  version: "14.4"
};

// 5. Database Object: Mimics the original structure for compatibility
export const Database = {
  __InternalSupabase: {
    PostgrestVersion: Constants.version
  },
  public: {
    Tables: Tables,
    Functions: DatabaseFunctions,
    Enums: Enums
  }
};