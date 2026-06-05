using System.ComponentModel.DataAnnotations;

namespace HRTMS.Models.DTOs;

public abstract record RefereePanelRequest(
    [Required] string RaceId,
    [Required] string LeadId,
    [Required] string Member1Id,
    [Required] string Member2Id);

public record CreateRefereePanelRequest(
    [Required] string RefereePanelId,
    string RaceId,
    string LeadId,
    string Member1Id,
    string Member2Id)
    : RefereePanelRequest(RaceId, LeadId, Member1Id, Member2Id);

public record UpdateRefereePanelRequest(
    string RaceId,
    string LeadId,
    string Member1Id,
    string Member2Id)
    : RefereePanelRequest(RaceId, LeadId, Member1Id, Member2Id);

public record RefereePanelResponse(
    string RefereePanelId,
    string RaceId,
    string LeadId,
    string Member1Id,
    string Member2Id);
