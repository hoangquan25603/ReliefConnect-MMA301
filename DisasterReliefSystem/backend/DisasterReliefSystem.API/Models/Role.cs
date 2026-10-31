using System.ComponentModel.DataAnnotations;

namespace DisasterReliefSystem.API.Models;

public class Role
{
 
    public int RoleId { get; set; }

  
    public string RoleName { get; set; } = string.Empty;


    public string? Description { get; set; }

    public virtual ICollection<User> Users { get; set; } = new List<User>();
}